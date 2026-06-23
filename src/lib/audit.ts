// Audit logging (HIPAA accountability). Append-only trail of who did what.

import { nanoid } from "nanoid";
import { getLiveStore } from "@/lib/data/store";
import type { AuditLog } from "@/lib/data/types";

export function logAudit(
  action: string,
  opts: { actor?: string; target?: string; detail?: string } = {},
): void {
  const store = getLiveStore();
  if (!store.auditLogs) store.auditLogs = [];
  const entry: AuditLog = {
    id: `aud_${nanoid(10)}`,
    orgId: store.org.id,
    actor: opts.actor ?? "system",
    action,
    target: opts.target,
    detail: opts.detail,
    createdAt: new Date().toISOString(),
  };
  store.auditLogs.push(entry);
  // Keep the trail bounded in the in-memory demo.
  if (store.auditLogs.length > 500) store.auditLogs.splice(0, store.auditLogs.length - 500);
}

export function getAuditLogs(limit = 100): AuditLog[] {
  const store = getLiveStore();
  return (store.auditLogs ?? []).slice(-limit).reverse();
}
