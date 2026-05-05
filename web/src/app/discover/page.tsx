import Link from "next/link";
import { CheckCircle2, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAllPerks } from "@/lib/perks";
import { getAllPets } from "@/lib/pets";

export const dynamic = "force-dynamic";

const VISIBLE_LIMIT = 60;

export default async function DiscoverPage() {
  // Fetch in parallel — Helius is the slow leg.
  const [perks, pets] = await Promise.all([fetchAllPerks(), getAllPets()]);
  const petByMint = new Map(pets.map((p) => [p.nftMint, p] as const));

  const totalCount = perks.length;
  const matchedCount = perks.reduce(
    (n, p) => (petByMint.has(p.mint) ? n + 1 : n),
    0,
  );

  // Matched first, then the rest in their natural order. Cap the rendered
  // grid — at 3K+ items, every extra <Card> costs SSR time and bytes.
  const sorted = [...perks].sort((a, b) => {
    const aHas = petByMint.has(a.mint) ? 0 : 1;
    const bHas = petByMint.has(b.mint) ? 0 : 1;
    return aHas - bHas;
  });
  const visible = sorted.slice(0, VISIBLE_LIMIT);
  const truncated = totalCount > VISIBLE_LIMIT;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Discover the Perks Collection
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every NFT in the IslandDAO Perks collection, live from Solana.{" "}
          <span className="text-foreground">
            {matchedCount} of {totalCount}
          </span>{" "}
          have a Pet ready.
        </p>
      </header>

      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((perk) => {
            const pet = petByMint.get(perk.mint);
            const card = (
              <Card className="h-full overflow-hidden py-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(188_235_196/0.22)_0%,_transparent_60%)]"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={perk.imageUrl}
                    alt={perk.name}
                    loading="lazy"
                    className={`absolute inset-0 size-full object-contain p-4 transition-transform duration-300 ${
                      pet
                        ? "group-hover:scale-[1.04]"
                        : "opacity-90"
                    }`}
                  />
                  {pet ? (
                    <Badge className="absolute left-3 top-3 border-transparent bg-primary/15 text-primary">
                      <CheckCircle2 className="size-3" /> Pet ready
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="absolute left-3 top-3 border-dashed bg-background/70 backdrop-blur"
                    >
                      No Pet yet
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {perk.name}
                    </h3>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {perk.mint.slice(0, 6)}…{perk.mint.slice(-6)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );

            return pet ? (
              <Link
                key={perk.mint}
                href={`/pets/${pet.id}`}
                className="group block"
              >
                {card}
              </Link>
            ) : (
              <div key={perk.mint} className="group block">
                {card}
              </div>
            );
          })}
        </div>
        {truncated && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Showing the first {VISIBLE_LIMIT} of {totalCount}. Pets-first
            ordering means everything ready is already on this page.
          </p>
        )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Search className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No NFTs returned</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Helius didn&apos;t return any items for this collection. Check the
        collection mint or your <code>HELIUS_API_KEY</code>.
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3" /> Tip: open the dev server log for the
        full Helius response.
      </p>
    </div>
  );
}
