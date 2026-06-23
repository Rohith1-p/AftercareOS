// In-memory token registry for the public escalation links (demo mode).
// In DB mode this lives on the Enrollment row (escalationToken column).

export const escalationTokens = new Map<string, { enrollmentId: string; patientId: string }>();
