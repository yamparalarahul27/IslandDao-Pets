"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut, Copy, Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function shorten(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { publicKey, disconnect, connecting, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
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

  if (!connected || !publicKey) {
    return (
      <Button
        size="sm"
        onClick={() => setVisible(true)}
        disabled={connecting}
        className="min-w-32"
      >
        <Wallet className="size-4" />
        {connecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  const addr = publicKey.toBase58();

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
        <Wallet className="size-4" />
        {shorten(addr)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {wallet?.adapter.name ?? "Wallet"}
        </DropdownMenuLabel>
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
