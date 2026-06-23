import { NextResponse } from "next/server";
import { processDueMessages } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

// Manual/dev trigger for the scheduler. Protected by a shared secret.
// Hit: /api/cron/process-due?secret=dev
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const allowed = process.env.CRON_SECRET || "dev";
  if (secret !== allowed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await processDueMessages();
  return NextResponse.json(report);
}
