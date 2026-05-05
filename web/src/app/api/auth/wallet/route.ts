import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  isVerifyTimestampFresh,
  mintWalletSession,
  parseVerifyTimestamp,
  verifyWalletSession,
  verifyWalletSignature,
  WALLET_SESSION_COOKIE,
  WALLET_SESSION_TTL_SECONDS,
} from "@/lib/wallet-session";

export const runtime = "nodejs";

const SOLANA_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

type Body = {
  wallet?: unknown;
  message?: unknown;
  signature?: unknown;
};

export async function GET() {
  const store = await cookies();
  const session = verifyWalletSession(
    store.get(WALLET_SESSION_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ verified: false });
  }
  return NextResponse.json({
    verified: true,
    wallet: session.wallet,
    expSeconds: session.expSeconds,
  });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const wallet = typeof body.wallet === "string" ? body.wallet : "";
  const message = typeof body.message === "string" ? body.message : "";
  const signature = typeof body.signature === "string" ? body.signature : "";

  if (!SOLANA_ADDR.test(wallet)) {
    return NextResponse.json({ error: "bad_wallet" }, { status: 400 });
  }
  const ts = parseVerifyTimestamp(message);
  if (!ts || !isVerifyTimestampFresh(ts)) {
    return NextResponse.json({ error: "stale_message" }, { status: 400 });
  }
  if (!verifyWalletSignature(message, signature, wallet)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  const { token, expSeconds } = mintWalletSession(wallet);
  const store = await cookies();
  store.set(WALLET_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WALLET_SESSION_TTL_SECONDS,
  });

  return NextResponse.json({ ok: true, wallet, expSeconds });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(WALLET_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
