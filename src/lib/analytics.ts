// Analytics aggregation (pure functions, testable). In mock mode these derive
// plausible numbers from the live store; with a DB they'd query MessageLog.

import { getLiveStore } from "@/lib/data/store";

export interface EngagementMetrics {
  messagesSent7d: number;
  messagesSent30d: number;
  responseRate: number; // % of enrolled patients who replied at least once
  journeyCompletionRate: number; // % completed vs total
  escalationsPer100: number;
  avgResponseMin: number | null;
  reviewsRequested30d: number;
  reviewCtr: number;
  series7d: { day: string; sent: number }[];
}

export function getEngagementMetrics(): EngagementMetrics {
  const store = getLiveStore();
  const enrollments = store.enrollments;
  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
  const total = enrollments.length || 1;
  const convPatients = new Set(store.conversations.map((c) => c.patientId));
  const responseRate = Math.round((convPatients.size / total) * 100);
  const escalations = store.alerts.length;
  const reviews = store.reviewRequests;
  const reviewClicked = reviews.filter((r) => r.clickedAt).length;

  // Build a deterministic 7-day series from a seed so charts aren't flat.
  const seed = store.enrollments.length + store.alerts.length;
  const series7d = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const base = 30 + ((seed * 7 + i * 13) % 25);
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), sent: base + (i === 5 || i === 6 ? 12 : 0) };
  });

  return {
    messagesSent7d: series7d.reduce((s, x) => s + x.sent, 0),
    messagesSent30d: series7d.reduce((s, x) => s + x.sent, 0) * 4 + 180,
    responseRate,
    journeyCompletionRate: Math.round((completed / total) * 100),
    escalationsPer100: Math.round((escalations / total) * 100),
    avgResponseMin: 14,
    reviewsRequested30d: reviews.length,
    reviewCtr: reviews.length ? Math.round((reviewClicked / reviews.length) * 100) : 0,
    series7d,
  };
}
