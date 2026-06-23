import { NextResponse } from "next/server";
import { exchangeCodeForToken, isSquareConfigured } from "@/lib/square";
import { getLiveStore } from "@/lib/data/store";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

// Square OAuth callback: ?code=... → exchange for tokens → store Integration.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) return NextResponse.redirect(new URL("/dashboard/settings?square=error", url.origin));
  if (!code) return NextResponse.redirect(new URL("/dashboard/settings?square=missing", url.origin));

  const store = getLiveStore();

  if (!isSquareConfigured()) {
    // Dev/demo: pretend the connection succeeded so the UI is demonstrable.
    store.integrations = store.integrations.filter((i) => i.provider !== "square");
    store.integrations.push({
      id: `int_${nanoid(8)}`,
      orgId: store.org.id,
      provider: "square",
      externalMerchantId: "DEMO_MERCHANT",
      status: "connected",
      connectedAt: new Date().toISOString(),
    });
    return NextResponse.redirect(new URL("/dashboard/settings?square=connected", url.origin));
  }

  try {
    const token = await exchangeCodeForToken(code);
    store.integrations = store.integrations.filter((i) => i.provider !== "square");
    store.integrations.push({
      id: `int_${nanoid(8)}`,
      orgId: store.org.id,
      provider: "square",
      externalMerchantId: token.merchantId,
      status: "connected",
      connectedAt: new Date().toISOString(),
    });
    return NextResponse.redirect(new URL("/dashboard/settings?square=connected", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/settings?square=error", url.origin));
  }
}
