import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getAuthUrl } from "@/lib/services/facebook.service";

export async function GET() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (isDemoMode) {
    return NextResponse.redirect(
      new URL("/zh-CN/social/accounts?error=demo_mode", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return NextResponse.redirect(
      new URL("/zh-CN/social/accounts?error=not_configured", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("fb_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const authUrl = getAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
