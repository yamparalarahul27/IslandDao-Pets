"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Download, Wallet, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SpritePlayer } from "@/components/SpritePlayer";
import { ROW_SPECS, type Pet } from "@/lib/types";
import { MOCK_OWNED_NFTS } from "@/lib/mock";

type Props = { pet: Pet };

export function PetDetailStage({ pet }: Props) {
  const [stateRow, setStateRow] = useState<string>("idle");

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
      {pet.spritesheetUrl ? (
        <SpritePlayer
          src={pet.spritesheetUrl}
          state={stateRow}
          size={320}
          fps={10}
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pet.nftImageUrl}
            alt={pet.displayName}
            className="size-64 rounded-xl object-contain p-4 ring-1 ring-border"
          />
          <p className="text-xs text-muted-foreground">
            Sprite preview will appear here once uploaded to Supabase.
          </p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-1.5">
        {ROW_SPECS.map((row) => (
          <button
            key={row.state}
            onClick={() => setStateRow(row.state)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              stateRow === row.state
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {row.state}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PetDownloadButton({ pet }: Props) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const ownsThisNft = useMemo(() => {
    if (!connected || !publicKey) return false;
    return MOCK_OWNED_NFTS.some((n) => n.mint === pet.nftMint);
  }, [connected, publicKey, pet.nftMint]);

  if (!connected) {
    return (
      <Button className="w-full" onClick={() => setVisible(true)}>
        <Wallet className="size-4" /> Connect to download
      </Button>
    );
  }

  if (!ownsThisNft) {
    return (
      <Button className="w-full" variant="secondary" disabled>
        <Lock className="size-4" /> Wallet doesn&apos;t hold this NFT
      </Button>
    );
  }

  const onDownload = () => {
    if (!pet.spritesheetUrl) {
      toast.message("Spritesheet not uploaded yet", {
        description:
          "The owner will publish this Pet's atlas to Supabase soon.",
      });
      return;
    }
    toast.success("Download starting…");
    window.location.href = pet.spritesheetUrl;
  };

  return (
    <Button className="w-full" onClick={onDownload}>
      <Download className="size-4" /> Download spritesheet
    </Button>
  );
}
