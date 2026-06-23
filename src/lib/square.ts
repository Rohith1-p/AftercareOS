// Square integration: OAuth, token exchange, webhook signature verification,
// catalog fetch. Runs in MOCK mode (sample data) until SQUARE_APP_ID/SECRET exist.

export const SCOPES = [
  "APPOINTMENTS_READ",
  "CUSTOMERS_READ",
  "MERCHANT_READ",
  "PAYMENTS_READ",
];

export function isSquareConfigured(): boolean {
  return Boolean(process.env.SQUARE_APP_ID && process.env.SQUARE_APP_SECRET);
}

function baseUrl(): string {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export function oauthAuthorizeUrl(state: string): string {
  const appId = process.env.SQUARE_APP_ID || "DUMMY_APP_ID";
  const redirect = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/square/callback`;
  const params = new URLSearchParams({
    client_id: appId,
    response_type: "code",
    scope: SCOPES.join("+"),
    state,
    session: "false",
  });
  return `${baseUrl()}/oauth2/authorize?${params.toString()}`;
}

export interface SquareToken {
  accessToken: string;
  refreshToken: string;
  merchantId: string;
  expiresAt: string;
}

export async function exchangeCodeForToken(code: string): Promise<SquareToken> {
  const res = await fetch(`${baseUrl()}/oauth2/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SQUARE_APP_ID,
      client_secret: process.env.SQUARE_APP_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Square token exchange failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    merchantId: data.merchant_id,
    expiresAt: data.expires_at,
  };
}

// Verify a Square webhook signature (x-square-hmacsha256-signature header).
export function verifySquareSignature(
  rawBody: string,
  signature: string,
  notificationUrl: string,
): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key) return true; // skip in dev when no key configured
  const crypto = require("node:crypto");
  const payload = notificationUrl + rawBody;
  const hash = crypto.createHmac("sha256", key).update(payload).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export interface SquareService {
  id: string;
  name: string;
}

export async function listServices(accessToken: string): Promise<SquareService[]> {
  // Mock catalog when no real token (sandbox/demo).
  if (!accessToken || accessToken.startsWith("mock")) {
    return [
      { id: "svc_botox", name: "Botox — 1 Area" },
      { id: "svc_filler_lips", name: "Lip Filler" },
      { id: "svc_filler_cheeks", name: "Cheek Filler" },
      { id: "svc_laser", name: "Laser Hair Removal — Underarms" },
      { id: "svc_peel", name: "Chemical Peel" },
      { id: "svc_microneedle", name: "Microneedling" },
      { id: "svc_consult", name: "New Patient Consult" },
    ];
  }
  const res = await fetch(`${baseUrl()}/v2/catalog/list?types=ITEM`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Square catalog fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.objects || [])
    .filter((o: { item_data?: { product_type?: string } }) => o.item_data?.product_type === "APPOINTMENTS_SERVICE")
    .map((o: { id: string; item_data: { name: string } }) => ({ id: o.id, name: o.item_data.name }));
}

// Resolve a booking webhook payload to an enrollable patient+service.
export interface CompletedBooking {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  completedAt: string;
}

export async function resolveBooking(
  accessToken: string,
  customerId: string,
  serviceVariationId: string,
): Promise<CompletedBooking | null> {
  if (!accessToken || accessToken.startsWith("mock")) return null;
  const custRes = await fetch(`${baseUrl()}/v2/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!custRes.ok) return null;
  const cust = (await custRes.json()).customer;
  return {
    customerName: `${cust.given_name ?? ""} ${cust.family_name ?? ""}`.trim() || "Patient",
    customerPhone: cust.phone_number ?? "",
    serviceId: serviceVariationId,
    serviceName: "Service",
    completedAt: new Date().toISOString(),
  };
}
