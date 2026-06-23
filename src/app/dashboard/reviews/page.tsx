import { Star, TrendingUp, MousePointerClick, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReviewRequests, getClinicProfile } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ReviewsPage() {
  const [requests, clinic] = await Promise.all([getReviewRequests(), getClinicProfile()]);
  const clicked = requests.filter((r) => r.clickedAt).length;
  const ctr = requests.length ? Math.round((clicked / requests.length) * 100) : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Reviews & Reputation"
        description="Turn completed journeys into 5-star Google reviews."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Google rating" value="4.9" tone="warn" icon={Star} hint="312 reviews" />
        <StatCard label="Review asks · 30d" value={requests.length} icon={TrendingUp} tone="brand" />
        <StatCard label="Click-through" value={`${ctr}%`} icon={MousePointerClick} tone="success" hint={`${clicked} of ${requests.length} clicked`} />
        <StatCard label="Avg / month" value="14" icon={Star} hint="vs 6 before AftercareOS" />
      </div>

      <Card className="mt-6">
        <div className="border-b border-hairline px-6 py-4">
          <h2 className="text-base font-bold text-ink">Review requests</h2>
        </div>
        <ul className="divide-y divide-hairline">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-6 py-3">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-star text-star" />
                ))}
              </div>
              <span className="text-sm font-semibold text-ink">Google review request</span>
              <Badge tone={r.clickedAt ? "success" : "neutral"}>
                {r.clickedAt ? "Clicked" : "Sent"}
              </Badge>
              <span className="ml-auto text-xs text-muted">{formatDate(r.sentAt)}</span>
              {clinic.reviewLink && (
                <a
                  href={clinic.reviewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-3 text-xs text-muted">
        The automatic “doing great? → review” branch and private-feedback routing arrive in Phase 5.
      </p>
    </div>
  );
}
