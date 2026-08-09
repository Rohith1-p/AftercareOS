-- 0001: persist the public escalation/review token on the Enrollment row.
--
-- Why: the token was previously held only in module-level Maps in
-- supabase-repo.ts and scheduler.ts. Those survive a single Node process, so
-- they work in local dev and die on serverless — every instance has its own
-- empty Map. In production that meant /w/:token and /r/:token could not
-- resolve, and submitEscalation() silently fell back to "most recently started
-- enrollment in the org", filing one patient's complaint against another.
--
-- The token is the only join key the public pages have, so it has to live in
-- the database.

ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "escalationToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_escalationToken_key"
  ON "Enrollment" ("escalationToken");
