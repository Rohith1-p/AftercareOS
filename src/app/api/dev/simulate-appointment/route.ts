import { NextResponse } from "next/server";
import { autoEnrollFromBooking } from "@/lib/booking-enroll";

export const dynamic = "force-dynamic";

// Dev/demo simulator: fire a "completed Square appointment" to demonstrate the
// zero-click auto-enroll flow without a real Square account.
// GET /api/dev/simulate-appointment?secret=dev&service=svc_botox&name=...&phone=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== (process.env.CRON_SECRET || "dev")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const serviceId = url.searchParams.get("service") || "svc_botox";
  const serviceName = url.searchParams.get("serviceName") || "Botox — 1 Area";
  const name = url.searchParams.get("name") || "Simulated Patient";
  const phone = url.searchParams.get("phone") || "+15552007777";

  const result = await autoEnrollFromBooking({ name, phone, serviceId, serviceName });
  return NextResponse.json(result);
}
