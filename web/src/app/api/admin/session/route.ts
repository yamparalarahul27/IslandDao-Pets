import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  isAdminWallet,
  isLoginTimestampFresh,
  parseAdminLoginTimestamp,
  verifyWalletSignature,
} from "@/lib/admin";
import { mintAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

const SOLANA_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

type Body = {
  wallet?: unknown;
  message?: unknown;
  signature?: unknown;
};

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
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!isAdminWallet(wallet)) {
    return NextResponse.json({ error: "not_admin" }, { status: 403 });
  }
  const ts = parseAdminLoginTimestamp(message);
  if (!ts || !isLoginTimestampFresh(ts)) {
    return NextResponse.json({ error: "stale_message" }, { status: 400 });
  }
  if (!verifyWalletSignature(message, signature, wallet)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  const { token } = mintAdminSession(wallet);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return NextResponse.json({ ok: true, expSeconds: token.split(".")[1] });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
