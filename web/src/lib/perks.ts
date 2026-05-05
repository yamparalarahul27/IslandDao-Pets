import "server-only";
import type { OwnedNft } from "@/lib/types";

/**
 * The on-chain Solana collection mint for IslandDAO Perks.
 * Confirmed via Helius DAS getAsset on 2026-05-05 — name: "PERK",
 * interface: MplCoreCollection.
 */
export const ISLANDDAO_PERKS_COLLECTION_MINT =
  "5XSXoWkcmynUSiwoi7XByRDiV9eomTgZQywgWrpYzKZ8";

const SOLANA_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

function rpcUrl(): string {
  const key = process.env.HELIUS_API_KEY;
  if (!key) throw new Error("Missing HELIUS_API_KEY");
  return `https://mainnet.helius-rpc.com/?api-key=${key}`;
}

type DasAsset = {
  id: string;
  ownership?: { owner?: string };
  content?: {
    metadata?: { name?: string };
    files?: Array<{ uri?: string; cdn_uri?: string }>;
    links?: { image?: string };
    json_uri?: string;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
};

function pickImage(asset: DasAsset): string {
  const file = asset.content?.files?.[0];
  return (
    file?.cdn_uri ??
    file?.uri ??
    asset.content?.links?.image ??
    ""
  );
}

function inPerksCollection(asset: DasAsset): boolean {
  return (asset.grouping ?? []).some(
    (g) =>
      g.group_key === "collection" &&
      g.group_value === ISLANDDAO_PERKS_COLLECTION_MINT,
  );
}

/**
 * Fetch every IslandDAO Perks NFT held by `wallet`. Pages through Helius DAS
 * up to a sane cap so a hostile caller can't ask us to fetch 100k assets.
 */
export async function fetchOwnedPerks(wallet: string): Promise<OwnedNft[]> {
  if (!SOLANA_ADDR.test(wallet)) return [];

  const url = rpcUrl();
  const out: OwnedNft[] = [];
  const limit = 1000;
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `owner-${page}`,
        method: "getAssetsByOwner",
        params: { ownerAddress: wallet, page, limit },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[perks] helius non-ok:", res.status, await res.text());
      break;
    }
    const json = (await res.json()) as { result?: { items?: DasAsset[] } };
    const items = json.result?.items ?? [];
    for (const it of items) {
      if (!inPerksCollection(it)) continue;
      out.push({
        mint: it.id,
        name: it.content?.metadata?.name ?? "IslandDAO Perks",
        imageUrl: pickImage(it),
        collection: "IslandDAO Perks",
      });
    }
    if (items.length < limit) break;
  }

  return out;
}

export type CollectionPerk = {
  mint: string;
  name: string;
  imageUrl: string;
};

// Helius returns ~2.3 MB for the Perks collection — over Next's fetch
// cache cap. Use a process-memory TTL cache instead.
type CachedAllPerks = { ts: number; value: CollectionPerk[] };
let allPerksCache: CachedAllPerks | null = null;
const ALL_PERKS_TTL_MS = 60_000;

/**
 * Fetch every NFT in the IslandDAO Perks collection. Paged Helius DAS
 * `getAssetsByGroup`. Cached in-process for 60s to keep the discover
 * page snappy and within the free Helius tier.
 */
export async function fetchAllPerks(): Promise<CollectionPerk[]> {
  const now = Date.now();
  if (allPerksCache && now - allPerksCache.ts < ALL_PERKS_TTL_MS) {
    return allPerksCache.value;
  }

  const url = rpcUrl();
  const out: CollectionPerk[] = [];
  const limit = 1000;
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `group-${page}`,
        method: "getAssetsByGroup",
        params: {
          groupKey: "collection",
          groupValue: ISLANDDAO_PERKS_COLLECTION_MINT,
          page,
          limit,
        },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[perks] helius non-ok:", res.status, await res.text());
      break;
    }
    const json = (await res.json()) as { result?: { items?: DasAsset[] } };
    const items = json.result?.items ?? [];
    for (const it of items) {
      out.push({
        mint: it.id,
        name: it.content?.metadata?.name ?? "IslandDAO Perks",
        imageUrl: pickImage(it),
      });
    }
    if (items.length < limit) break;
  }

  allPerksCache = { ts: now, value: out };
  return out;
}

/**
 * Lightweight ownership check for a single asset — used to gate the
 * download button on the pet detail page.
 */
export async function walletOwnsAsset(
  wallet: string,
  assetId: string,
): Promise<boolean> {
  if (!SOLANA_ADDR.test(wallet) || !SOLANA_ADDR.test(assetId)) return false;
  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "asset",
      method: "getAsset",
      params: { id: assetId },
    }),
    cache: "no-store",
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { result?: DasAsset };
  return json.result?.ownership?.owner === wallet;
}
