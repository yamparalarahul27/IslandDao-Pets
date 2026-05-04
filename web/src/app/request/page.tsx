"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ArrowLeft, Send, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_OWNED_NFTS } from "@/lib/mock";

function RequestForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const presetMint = sp.get("mint") ?? "";
  const presetName = sp.get("name") ?? "";

  const [mint, setMint] = useState(presetMint);
  const [name, setName] = useState(presetName);
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const owned = connected ? MOCK_OWNED_NFTS : [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connected) {
      setVisible(true);
      return;
    }
    if (!mint.trim()) {
      toast.error("Pick the NFT you'd like a Pet for");
      return;
    }
    setSubmitting(true);
    // Stub: in production, POST to /api/requests, persist to Supabase.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast.success("Request submitted", {
      description: "We'll start crafting your Pet shortly.",
    });
    router.push("/my-pets");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nft">Which NFT?</Label>
        {owned.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {owned.map((n) => {
              const active = mint === n.mint;
              return (
                <button
                  type="button"
                  key={n.mint}
                  onClick={() => {
                    setMint(n.mint);
                    setName(n.name);
                  }}
                  className={`flex items-center gap-3 rounded-lg border bg-card p-2 text-left transition-colors ${
                    active
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-foreground/20"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.imageUrl}
                    alt={n.name}
                    className="size-12 rounded-md bg-secondary object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {n.name}
                    </div>
                    <div className="truncate font-mono text-[11px] text-muted-foreground">
                      {n.mint.slice(0, 6)}…{n.mint.slice(-6)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Input
            id="nft"
            placeholder="Mint address"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">NFT name</Label>
        <Input
          id="name"
          placeholder="IslandDAO Perks #…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Style notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any specific traits, colors, or vibes you want emphasized?"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@island.club"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll ping you when your Pet is ready. Otherwise check back here.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/40 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Connected wallet</span>
          <span className="font-mono text-xs">
            {connected && publicKey
              ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
              : "not connected"}
          </span>
        </div>
      </div>

      {connected ? (
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          <Send className="size-4" />
          {submitting ? "Submitting…" : "Submit request"}
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => setVisible(true)}
        >
          <Wallet className="size-4" /> Connect wallet to request
        </Button>
      )}
    </form>
  );
}

export default function RequestPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <Link
        href="/my-pets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to My Pets
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">Request a Pet</h1>
      <p className="mt-2 text-muted-foreground">
        We&apos;ll generate a Codex-compatible spritesheet for one of your
        IslandDAO Perks NFTs. Most requests turn around within a few days.
      </p>

      <Card className="mt-8">
        <CardContent className="p-6">
          <Suspense
            fallback={
              <div className="text-sm text-muted-foreground">Loading…</div>
            }
          >
            <RequestForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
