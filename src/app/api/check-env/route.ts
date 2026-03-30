import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ configured' : '❌ missing',
      DATABASE_URL_PREFIX: process.env.DATABASE_URL?.split('://')[1]?.split('@')[0] + '@***' || 'N/A',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ configured' : '❌ missing',
      NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN || 'N/A',
    },
  });
}
