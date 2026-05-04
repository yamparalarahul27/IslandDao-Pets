"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Wallet,
  Sparkles,
  Download,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MOCK_OWNED_NFTS } from "@/lib/mock";
import type { Pet } from "@/lib/types";
import { lookupPetsForMints } from "./actions";

export default function MyPetsPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const owned = useMemo(() => {
    if (!connected) return [];
    // TODO: replace with Helius DAS getAssetsByOwner once wired.
    return MOCK_OWNED_NFTS;
  }, [connected]);

  const [petByMint, setPetByMint] = useState<Map<string, Pet>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (owned.length === 0) {
      setPetByMint(new Map());
      return;
    }
    let cancelled = false;
    setLoading(true);
    lookupPetsForMints(owned.map((n) => n.mint))
      .then((pets) => {
        if (cancelled) return;
        const map = new Map<string, Pet>();
        for (const p of pets) map.set(p.nftMint, p);
        setPetByMint(map);
      })
      .catch((e) => {
        console.error("[my-pets] lookup failed", e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [owned]);

  if (!connected) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Wallet className="size-6" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Connect your wallet
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          We need to peek at your IslandDAO Perks NFTs to match them with Pets.
          Nothing is signed unless you choose to claim.
        </p>
        <Button size="lg" className="mt-6" onClick={() => setVisible(true)}>
          <Wallet className="size-4" /> Connect wallet
        </Button>
      </div>
    );
  }

  const matched = owned.filter((n) => petByMint.has(n.mint));
  const unmatched = owned.filter((n) => !petByMint.has(n.mint));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Pets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connected as{" "}
            <span className="font-mono text-foreground">
              {publicKey?.toBase58().slice(0, 4)}…
              {publicKey?.toBase58().slice(-4)}
            </span>
            . Found {owned.length} IslandDAO Perks NFT
            {owned.length === 1 ? "" : "s"}.
            {loading && " Looking up Pets…"}
          </p>
        </div>
      </header>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-4 text-primary" /> Pets ready to claim
          <Badge variant="secondary" className="ml-1">
            {matched.length}
          </Badge>
        </h2>
        {matched.length === 0 ? (
          <EmptyState
            title="No matched Pets yet"
            body="None of your perk NFTs have a Pet generated yet. Request one below."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matched.map((nft) => {
              const pet = petByMint.get(nft.mint)!;
              return (
                <Card key={nft.mint} className="overflow-hidden py-0">
                  <div className="relative aspect-square w-full bg-secondary">
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(188_235_196/0.30)_0%,_transparent_60%)]"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="absolute inset-0 size-full object-contain p-6"
                    />
                    <Badge className="absolute left-3 top-3 border-transparent bg-primary/15 text-primary">
                      <CheckCircle2 className="size-3" /> Pet ready
                    </Badge>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <h3 className="truncate text-sm font-semibold">
                        {pet.displayName}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {nft.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/pets/${pet.id}`}
                        className={cn(buttonVariants({ size: "sm" }), "flex-1")}
                      >
                        <Download className="size-4" /> Download
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <PlusCircle className="size-4 text-primary" /> Need a Pet
          <Badge variant="secondary" className="ml-1">
            {unmatched.length}
          </Badge>
        </h2>
        {unmatched.length === 0 ? (
          <EmptyState
            title="All set!"
            body="Every NFT in your wallet already has a matching Pet."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unmatched.map((nft) => (
              <Card key={nft.mint} className="overflow-hidden py-0">
                <div className="relative aspect-square w-full bg-secondary">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(188_235_196/0.18)_0%,_transparent_60%)]"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="absolute inset-0 size-full object-contain p-6 grayscale opacity-80"
                  />
                  <Badge
                    variant="outline"
                    className="absolute left-3 top-3 border-dashed bg-background/80 backdrop-blur"
                  >
                    No Pet yet
                  </Badge>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <h3 className="truncate text-sm font-semibold">{nft.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {nft.collection}
                    </p>
                  </div>
                  <Link
                    href={{
                      pathname: "/request",
                      query: { mint: nft.mint, name: nft.name },
                    }}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "secondary" }),
                      "w-full",
                    )}
                  >
                    <PlusCircle className="size-4" /> Request Pet
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
