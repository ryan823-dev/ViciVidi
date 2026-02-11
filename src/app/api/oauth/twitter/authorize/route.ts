import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePKCE, generateState, getAuthUrl } from "@/lib/services/twitter.service";

export async function GET() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (isDemoMode) {
    return NextResponse.redirect(
      new URL("/zh-CN/social/accounts?error=demo_mode", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/zh-CN/social/accounts?error=not_configured", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePKCE();

  const cookieStore = await cookies();

  cookieStore.set("tw_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  cookieStore.set("tw_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const authUrl = getAuthUrl(state, codeChallenge);
  return NextResponse.redirect(authUrl);
}
