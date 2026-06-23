import { NextResponse } from "next/server";
import { verifySquareSignature, resolveBooking } from "@/lib/square";
import { getLiveStore } from "@/lib/data/store";
import { autoEnrollFromBooking } from "@/lib/booking-enroll";

export const dynamic = "force-dynamic";

// Square webhook. On a COMPLETED booking, auto-enroll the patient into the
// mapped protocol. Signature verified when SQUARE_WEBHOOK_SIGNATURE_KEY is set.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") || "";
  const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/square`;

  if (!verifySquareSignature(rawBody, signature, notificationUrl)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: { object?: { booking?: Record<string, unknown> } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const store = getLiveStore();
  const integration = store.integrations.find((i) => i.provider === "square");
  const accessToken = integration?.externalMerchantId?.startsWith("DEMO") ? "mock" : "";

  // Square fires booking.updated for many transitions; we care about COMPLETED.
  const booking = event.data?.object?.booking as
    | { status?: string; customer_id?: string; appointment_segments?: { service_variation_id?: string }[] }
    | undefined;

  if (booking?.status === "COMPLETED" && booking.customer_id) {
    const serviceVariationId = booking.appointment_segments?.[0]?.service_variation_id ?? "";
    const resolved = await resolveBooking(accessToken, booking.customer_id, serviceVariationId);
    if (resolved?.customerPhone) {
      await autoEnrollFromBooking({
        name: resolved.customerName,
        phone: resolved.customerPhone,
        serviceId: serviceVariationId,
        serviceName: resolved.serviceName,
        completedAt: resolved.completedAt,
      });
    }
  }

  return NextResponse.json({ received: true });
}
