"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Check,
  Copy,
  Loader2,
  LogOut,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWalletSession } from "@/components/providers/WalletSessionProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function shorten(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { publicKey, disconnect, connecting, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { isVerified, verifying, verify } = useWalletSession();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button size="sm" variant="default" disabled className="min-w-32">
        <Wallet className="size-4" /> Connect
      </Button>
    );
  }

  // 1. Not yet verified — same look whether the adapter is connected or not.
  //    Click handler picks the right next step.
  if (!connected || !publicKey || !isVerified) {
    const label = connecting
      ? "Connecting…"
      : verifying
        ? "Verifying…"
        : "Connect Wallet";
    const onClick = () => {
      if (!connected) setVisible(true);
      else verify();
    };
    return (
      <Button
        size="sm"
        onClick={onClick}
        disabled={connecting || verifying}
        className="min-w-32"
      >
        {connecting || verifying ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Wallet className="size-4" />
        )}
        {label}
      </Button>
    );
  }

  const addr = publicKey.toBase58();

  // 2. Connected and verified — address dropdown with copy + disconnect.
  const copy = async () => {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ size: "sm", variant: "secondary" }),
          "min-w-32",
        )}
      >
        <ShieldCheck className="size-4 text-primary" />
        {shorten(addr)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
          {wallet?.adapter.name ?? "Wallet"} · verified
        </div>
        <DropdownMenuItem onClick={copy}>
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          Copy address
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => disconnect().catch(() => {})}
          variant="destructive"
        >
          <LogOut className="size-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
