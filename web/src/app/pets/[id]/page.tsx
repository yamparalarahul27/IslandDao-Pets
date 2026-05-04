import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPet } from "@/lib/pets";
import { ROW_SPECS } from "@/lib/types";
import { PetDetailStage, PetDownloadButton } from "./PetDetailClient";

export const dynamic = "force-dynamic";

export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getPet(id);
  if (!pet) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/12 via-card to-secondary">
            <PetDetailStage pet={pet} />
          </div>

          <Separator className="my-10" />

          <h2 className="text-lg font-semibold">Animation rows</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each Pet ships with these states baked into the 1536×1872 atlas.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ROW_SPECS.map((row, i) => (
              <div
                key={row.state}
                className="rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{row.state}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    row {i}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {row.frames} frames
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="rounded-2xl border bg-card p-6">
            <Badge className="border-transparent bg-primary/15 text-primary">
              Codex-ready
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {pet.displayName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pet.description}
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">NFT</dt>
                <dd className="text-right">{pet.nftName}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Mint</dt>
                <dd className="break-all text-right font-mono text-xs">
                  {pet.nftMint.slice(0, 6)}…{pet.nftMint.slice(-6)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Atlas</dt>
                <dd className="font-mono text-xs">1536×1872 · 8×9</dd>
              </div>
            </dl>

            <Separator className="my-6" />

            <PetDownloadButton pet={pet} />
            <p className="mt-3 text-xs text-muted-foreground">
              Connect a wallet that holds this NFT to enable downloads.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
