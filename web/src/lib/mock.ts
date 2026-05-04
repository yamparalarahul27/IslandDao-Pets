import type { OwnedNft, Pet } from "./types";

/**
 * Twelve canonical IslandDAO Perks zodiac creatures, sourced from
 * islanddao.org/assets/perks/. Mints below are placeholders until the
 * real on-chain mint addresses are wired in.
 */

type SeedPet = {
  id: string;
  perkSlug: string;
  displayName: string;
  description: string;
  nftMint: string;
  status: Pet["status"];
  createdAt: string;
};

const SEEDS: SeedPet[] = [
  {
    id: "dragon",
    perkSlug: "dragon",
    displayName: "Lucky Dragon",
    description: "Storm-born and quietly furious. Breathes mint, not fire.",
    nftMint: "Drg11111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-05-02T14:00:00Z",
  },
  {
    id: "tiger",
    perkSlug: "tiger",
    displayName: "Striped Sentinel",
    description: "A purple-striped jungle spirit with a lazy tail flick.",
    nftMint: "Tgr11111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-05-01T11:00:00Z",
  },
  {
    id: "rabbit",
    perkSlug: "rabbit",
    displayName: "Moon Hopper",
    description: "Three steps ahead, always. Friendly, never still.",
    nftMint: "Rbt11111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-30T09:00:00Z",
  },
  {
    id: "ox",
    perkSlug: "ox",
    displayName: "Patient Ox",
    description: "Slow, sure, and weirdly comforting to have around.",
    nftMint: "Ox111111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-29T18:00:00Z",
  },
  {
    id: "snake",
    perkSlug: "snake",
    displayName: "Tidepool Coil",
    description: "Coastal, cool-headed, never out of options.",
    nftMint: "Snk11111111111111111111111111111111111111111",
    status: "in_progress",
    createdAt: "2026-04-27T16:00:00Z",
  },
  {
    id: "horse",
    perkSlug: "horse",
    displayName: "Trade Winds",
    description: "Long stride, salt in the mane, lives for the open path.",
    nftMint: "Hrs11111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-25T07:00:00Z",
  },
  {
    id: "goat",
    perkSlug: "goat",
    displayName: "Cliffside Goat",
    description: "Calm, deeply unbothered, knows every shortcut on the island.",
    nftMint: "Gt111111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-22T11:00:00Z",
  },
  {
    id: "monkey",
    perkSlug: "monkey",
    displayName: "Coconut Bandit",
    description: "Charming. Devious. Will steal your snacks.",
    nftMint: "Mky11111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "rooster",
    perkSlug: "rooster",
    displayName: "Dawn Caller",
    description: "Loud at sunrise, indispensable by noon.",
    nftMint: "Rst11111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-18T05:00:00Z",
  },
  {
    id: "inu",
    perkSlug: "inu",
    displayName: "Loyal Inu",
    description: "Pointy ears, soft heart, refuses to be left behind.",
    nftMint: "Inu11111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-16T13:00:00Z",
  },
  {
    id: "pig",
    perkSlug: "pig",
    displayName: "Lucky Pig",
    description: "Round, generous, surprisingly fast in a pinch.",
    nftMint: "Pg111111111111111111111111111111111111111111",
    status: "ready",
    createdAt: "2026-04-14T08:00:00Z",
  },
  {
    id: "mouse",
    perkSlug: "mouse",
    displayName: "Quiet Mouse",
    description: "Tiny, observant, knows where the snacks are buried.",
    nftMint: "Mse11111111111111111111111111111111111111111",
    status: "in_progress",
    createdAt: "2026-04-12T15:00:00Z",
  },
];

export const MOCK_PETS: Pet[] = SEEDS.map((seed, i) => {
  const tokenNumber = String(42 + i * 13).padStart(3, "0");
  const titleAnimal =
    seed.perkSlug.charAt(0).toUpperCase() + seed.perkSlug.slice(1);
  return {
    id: seed.id,
    displayName: seed.displayName,
    description: seed.description,
    nftMint: seed.nftMint,
    nftName: `IslandDAO Perks #${tokenNumber} — ${titleAnimal}`,
    nftImageUrl: `/perks/perk-${seed.perkSlug}.png`,
    spritesheetUrl: null,
    status: seed.status,
    createdAt: seed.createdAt,
  };
});

const ownedSlugs = ["tiger", "horse", "monkey"] as const;

export const MOCK_OWNED_NFTS: OwnedNft[] = ownedSlugs.map((slug) => {
  const pet = MOCK_PETS.find((p) => p.id === slug)!;
  return {
    mint: pet.nftMint,
    name: pet.nftName,
    imageUrl: pet.nftImageUrl,
    collection: "IslandDAO Perks",
  };
});

// One owned NFT without a Pet yet, to exercise the "Need a Pet" flow.
MOCK_OWNED_NFTS.push({
  mint: "Pen11111111111111111111111111111111111111111",
  name: "IslandDAO Perks #420 — Untitled Wanderer",
  imageUrl: "/perks/perk-mouse.png",
  collection: "IslandDAO Perks",
});

export function findPetForNft(mint: string): Pet | undefined {
  return MOCK_PETS.find((p) => p.nftMint === mint);
}

export function getPet(id: string): Pet | undefined {
  return MOCK_PETS.find((p) => p.id === id);
}
