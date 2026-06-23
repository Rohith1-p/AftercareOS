import { describe, it, expect, beforeEach } from "vitest";
import { logAudit, getAuditLogs } from "@/lib/audit";
import { resetLiveStore, getLiveStore } from "@/lib/data/store";
import { t } from "@/lib/i18n";

describe("audit log", () => {
  beforeEach(() => resetLiveStore());

  it("appends entries and reads them newest-first", () => {
    logAudit("enroll.create", { actor: "owner", target: "enr_1" });
    logAudit("alert.resolve", { actor: "owner", target: "alert_1", detail: "RESOLVED" });
    const logs = getAuditLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe("alert.resolve"); // newest first
  });

  it("writes into the store the pages read", () => {
    logAudit("clinic.update", { actor: "owner" });
    expect(getLiveStore().auditLogs?.length).toBeGreaterThan(0);
  });

  it("caps the trail length", () => {
    for (let i = 0; i < 600; i++) logAudit("test", { detail: String(i) });
    expect(getLiveStore().auditLogs!.length).toBeLessThanOrEqual(500);
  });
});

describe("i18n", () => {
  it("returns english by default and spanish translations", () => {
    expect(t("en", "title")).toBe("Tell us what's going on");
    expect(t("es", "title")).toBe("Cuéntanos qué pasa");
    expect(t("en", "submit")).toBe("Send to clinic");
    expect(t("es", "submit")).toBe("Enviar a la clínica");
  });
});
