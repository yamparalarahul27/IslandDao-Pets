"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

const VERIFY_PREFIX = "islanddao-pets:wallet-verify:";

type State = {
  verifying: boolean;
  verifiedWallet: string | null;
  expSeconds: number | null;
  /** True until the initial GET /api/auth/wallet has resolved. */
  hydrating: boolean;
};

type Ctx = State & {
  isVerified: boolean;
  verify: () => Promise<boolean>;
  unverify: () => Promise<void>;
};

const WalletSessionContext = createContext<Ctx | null>(null);

export function WalletSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { connected, publicKey, signMessage } = useWallet();
  const [state, setState] = useState<State>({
    verifying: false,
    verifiedWallet: null,
    expSeconds: null,
    hydrating: true,
  });

  // Track which wallet we've already auto-prompted so we don't loop on a cancel.
  const promptedFor = useRef<string | null>(null);

  // Hydrate session state from existing cookie on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/wallet", { method: "GET", cache: "no-store" })
      .then((r) => r.json())
      .then((d: { verified?: boolean; wallet?: string; expSeconds?: number }) => {
        if (cancelled) return;
        if (d.verified && d.wallet) {
          setState({
            verifying: false,
            verifiedWallet: d.wallet,
            expSeconds: d.expSeconds ?? null,
            hydrating: false,
          });
        } else {
          setState((s) => ({ ...s, hydrating: false }));
        }
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, hydrating: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const verify = useCallback(async (): Promise<boolean> => {
    if (!connected || !publicKey || !signMessage) return false;
    setState((s) => ({ ...s, verifying: true }));
    const wallet = publicKey.toBase58();
    try {
      const message = `${VERIFY_PREFIX}${Date.now()}`;
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase64 = bytesToBase64(signature);
      const res = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet, message, signature: signatureBase64 }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        wallet?: string;
        expSeconds?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setState((s) => ({ ...s, verifying: false }));
        toast.error("Wallet verification failed", { description: data.error });
        return false;
      }
      setState({
        verifying: false,
        verifiedWallet: data.wallet ?? wallet,
        expSeconds: data.expSeconds ?? null,
        hydrating: false,
      });
      toast.success("Wallet verified");
      return true;
    } catch (e) {
      console.error("[wallet-session] verify rejected", e);
      setState((s) => ({ ...s, verifying: false }));
      return false;
    }
  }, [connected, publicKey, signMessage]);

  const unverify = useCallback(async () => {
    setState({
      verifying: false,
      verifiedWallet: null,
      expSeconds: null,
      hydrating: false,
    });
    promptedFor.current = null;
    try {
      await fetch("/api/auth/wallet", { method: "DELETE" });
    } catch {
      // best-effort cleanup
    }
  }, []);

  // Auto-prompt on connect (or when wallet changes), once per wallet.
  useEffect(() => {
    if (state.hydrating) return;
    if (!connected || !publicKey) return;
    const wallet = publicKey.toBase58();
    if (state.verifiedWallet === wallet) return;
    if (state.verifying) return;
    if (promptedFor.current === wallet) return;
    promptedFor.current = wallet;
    void verify();
  }, [
    connected,
    publicKey,
    state.hydrating,
    state.verifiedWallet,
    state.verifying,
    verify,
  ]);

  // On disconnect, drop the cookie.
  useEffect(() => {
    if (!connected && state.verifiedWallet) {
      void unverify();
    }
  }, [connected, state.verifiedWallet, unverify]);

  // If a different wallet connects, drop the old session.
  useEffect(() => {
    if (!publicKey || !state.verifiedWallet) return;
    if (publicKey.toBase58() !== state.verifiedWallet) {
      void unverify();
    }
  }, [publicKey, state.verifiedWallet, unverify]);

  const isVerified =
    !!publicKey &&
    !!state.verifiedWallet &&
    publicKey.toBase58() === state.verifiedWallet;

  return (
    <WalletSessionContext.Provider
      value={{ ...state, isVerified, verify, unverify }}
    >
      {children}
    </WalletSessionContext.Provider>
  );
}

export function useWalletSession(): Ctx {
  const ctx = useContext(WalletSessionContext);
  if (!ctx)
    throw new Error("useWalletSession must be used inside WalletSessionProvider");
  return ctx;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return typeof window === "undefined"
    ? Buffer.from(bytes).toString("base64")
    : window.btoa(bin);
}
