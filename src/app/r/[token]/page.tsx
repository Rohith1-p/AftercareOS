import { redirect } from "next/navigation";
import { getLiveStore, getClinicProfile } from "@/lib/data";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-server";
import { getEnrollmentByToken } from "@/lib/data/supabase-repo";
import { reviewTokens } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

// Record the click against the enrollment's ReviewRequest. Best-effort: a
// tracking failure must never stop the patient reaching the review page.
async function recordClick(token: string): Promise<void> {
  if (isSupabaseConfigured) {
    const enrollment = await getEnrollmentByToken(token);
    if (!enrollment) return;
    const { data: rr } = await supabaseAdmin!
      .from("ReviewRequest")
      .select("id,clickedAt")
      .eq("enrollmentId", enrollment.id)
      .order("sentAt", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rr && !rr.clickedAt) {
      await supabaseAdmin!
        .from("ReviewRequest")
        .update({ clickedAt: new Date().toISOString() })
        .eq("id", rr.id);
    }
    return;
  }

  const entry = reviewTokens.get(token);
  if (!entry?.reviewRequestId) return;
  const rr = getLiveStore().reviewRequests.find((r) => r.id === entry.reviewRequestId);
  if (rr && !rr.clickedAt) rr.clickedAt = new Date().toISOString();
}

// Tracked review link. Records the click, then redirects to the clinic's
// public review page (Google, etc.).
export default async function ReviewRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const clinic = await getClinicProfile();

  try {
    await recordClick(token);
  } catch {
    // Swallow: the redirect below matters more than the analytics row.
  }

  redirect(clinic.reviewLink || "https://google.com");
}
