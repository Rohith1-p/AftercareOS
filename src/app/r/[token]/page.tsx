import { redirect } from "next/navigation";
import { getLiveStore, getClinicProfile } from "@/lib/data";
import { reviewTokens } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

// Tracked review link. Records the click on the ReviewRequest, then redirects
// to the clinic's public review page (Google, etc.).
export default async function ReviewRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const store = getLiveStore();
  const clinic = await getClinicProfile();

  const entry = reviewTokens.get(token);
  if (entry?.reviewRequestId) {
    const rr = store.reviewRequests.find((r) => r.id === entry.reviewRequestId);
    if (rr && !rr.clickedAt) rr.clickedAt = new Date().toISOString();
  }

  redirect(clinic.reviewLink || "https://google.com");
}
