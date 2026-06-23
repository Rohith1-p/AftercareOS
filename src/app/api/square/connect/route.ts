import { NextResponse } from "next/server";
import { oauthAuthorizeUrl, isSquareConfigured } from "@/lib/square";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

// Begin Square OAuth: redirect merchant to Square consent screen.
export async function GET() {
  const state = nanoid(12);
  if (!isSquareConfigured()) {
    // Dev mode: no Square app configured — show guidance instead of a dead redirect.
    return NextResponse.redirect(
      new URL(
        "/dashboard/settings?square=notconfigured",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
      ),
    );
  }
  return NextResponse.redirect(oauthAuthorizeUrl(state));
}
