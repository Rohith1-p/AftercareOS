// Twilio wrapper. Sends SMS when credentials are configured; otherwise runs in
// MOCK mode (logs + returns a fake SID) so the whole product is demoable.

export interface SendResult {
  sid: string;
  status: string;
  mock: boolean;
}

export function hasTwilio(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

export function defaultFromNumber(): string | undefined {
  return process.env.TWILIO_FROM_NUMBER || undefined;
}

let mockSeq = 0;
function mockSid(): string {
  mockSeq += 1;
  return `MOCK${Date.now().toString(36)}${mockSeq}`;
}

export async function sendSms(
  to: string,
  body: string,
  opts: { from?: string; mediaUrl?: string } = {},
): Promise<SendResult> {
  const from = opts.from ?? defaultFromNumber();

  if (!hasTwilio()) {
    console.log(`[twilio:mock] → ${to}${from ? ` (from ${from})` : ""}: ${body.slice(0, 80)}…`);
    return { sid: mockSid(), status: "queued", mock: true };
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const msg = await client.messages.create({
    to,
    body,
    ...(from ? { from } : {}),
    ...(process.env.TWILIO_MESSAGING_SERVICE_SID
      ? { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
      : {}),
    ...(opts.mediaUrl ? { mediaUrl: [opts.mediaUrl] } : {}),
  });
  return { sid: msg.sid, status: msg.status, mock: false };
}

// Provision a dedicated number for a clinic (US local, SMS-capable).
export async function provisionNumber(areaCode?: string): Promise<{ phone: string; mock: boolean }> {
  if (!hasTwilio()) {
    const fake = `+1555${String(Math.floor(1000 + Math.random() * 8999)).padStart(4, "0")}`;
    return { phone: fake, mock: true };
  }
  const twilio = (await import("twilio")).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const search = await client.availablePhoneNumbers("US").local.list({
    limit: 20,
    ...(areaCode ? { areaCode: Number(areaCode) } : {}),
  });
  const smsCapable = search.find((n) => n.capabilities?.sms);
  if (!smsCapable) throw new Error("No SMS-capable numbers available");
  const bought = await client.incomingPhoneNumbers.create({ phoneNumber: smsCapable.phoneNumber });
  return { phone: bought.phoneNumber, mock: false };
}

// Validate an inbound Twilio webhook signature (used by /api/webhooks/sms).
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken?: string,
): boolean {
  if (!hasTwilio() || !authToken) return true; // skip in mock/dev
  const twilio = require("twilio");
  return twilio.validateRequest(authToken, signature, url, params);
}
