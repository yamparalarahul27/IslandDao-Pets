"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SpritePlayer } from "@/components/SpritePlayer";
import type { Pet } from "@/lib/types";

function StatusBadge({ status }: { status: Pet["status"] }) {
  if (status === "ready") {
    return (
      <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-transparent">
        <Sparkles className="size-3" /> Ready
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge variant="secondary" className="border-transparent">
        In progress
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-dashed">
      Requested
    </Badge>
  );
}

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <Link href={`/pets/${pet.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md py-0">
        <div className="relative aspect-square w-full overflow-hidden bg-secondary">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(188_235_196/0.30)_0%,_transparent_60%)]"
          />
          {pet.spritesheetUrl ? (
            <div className="absolute inset-0 grid place-items-center">
              <SpritePlayer
                src={pet.spritesheetUrl}
                state="idle"
                size={192}
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pet.nftImageUrl}
              alt={pet.displayName}
              className="absolute inset-0 size-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={pet.status} />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">
                {pet.displayName}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {pet.nftName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
