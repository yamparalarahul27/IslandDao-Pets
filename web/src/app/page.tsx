import Link from "next/link";
import { ArrowRight, Sparkles, Wallet, Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PetCard } from "@/components/PetCard";
import { MOCK_PETS } from "@/lib/mock";

export default function Home() {
  const recent = [...MOCK_PETS]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="flex flex-col items-start gap-6 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="size-3" />
            New Pets drop weekly
          </span>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            A spirit pet for every{" "}
            <span className="bg-gradient-to-br from-[#bcebc4] to-[#e2ffe7] bg-clip-text text-transparent">
              IslandDAO Perk
            </span>
            .
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Connect your Solana wallet, find the Pet that matches your perk
            NFT, and download the spritesheet for Codex, your site, or anywhere
            you want a tiny companion.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/my-pets"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <Wallet className="size-4" /> Find my Pet
            </Link>
            <Link
              href="#recent"
              className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
            >
              See recent drops <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent grid */}
      <section
        id="recent"
        className="mx-auto w-full max-w-6xl px-6 pb-24"
      >
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Recently added
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest Pets minted for IslandDAO perk NFT holders.
            </p>
          </div>
          <Link
            href="/my-pets"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            See yours →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-28">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Step
            n={1}
            icon={<Wallet className="size-5" />}
            title="Connect wallet"
            body="Use Phantom, Solflare, Jupiter, or any Solana wallet."
          />
          <Step
            n={2}
            icon={<Sparkles className="size-5" />}
            title="Match your NFT"
            body="We check your IslandDAO Perks holdings against the Pet catalog."
          />
          <Step
            n={3}
            icon={<Download className="size-5" />}
            title="Download Pet"
            body="Get the spritesheet + pet.json bundle for Codex or the web."
          />
        </div>
      </section>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-xs font-mono text-muted-foreground">0{n}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
