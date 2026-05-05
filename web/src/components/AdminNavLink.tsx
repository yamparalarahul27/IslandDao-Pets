"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { isCurrentWalletAdmin } from "@/app/admin/upload/actions";

export function AdminNavLink() {
  const { connected, publicKey } = useWallet();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      setShow(false);
      return;
    }
    let cancelled = false;
    isCurrentWalletAdmin(publicKey.toBase58())
      .then((ok) => {
        if (!cancelled) setShow(ok);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey]);

  if (!show) return null;
  return (
    <Link
      href="/admin/upload"
      className="text-primary transition-colors hover:text-primary/80"
    >
      Admin
    </Link>
  );
}
