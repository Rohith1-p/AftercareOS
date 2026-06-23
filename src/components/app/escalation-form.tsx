"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { submitEscalationAction } from "@/app/dashboard/patients/actions";
import { t, type Lang } from "@/lib/i18n";

const SEVERITIES = [
  { value: "LOW", labelKey: "mild", descKey: "mildDesc" },
  { value: "MEDIUM", labelKey: "moderate", descKey: "moderateDesc" },
  { value: "HIGH", labelKey: "urgent", descKey: "urgentDesc" },
  { value: "URGENT", labelKey: "emergency", descKey: "emergencyDesc" },
] as const;

export function EscalationForm({ token, lang = "en" }: { token: string; lang?: Lang }) {
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitEscalationAction({ token, message, severity });
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="glass mx-auto mt-16 max-w-md rounded-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-pill bg-success/15 text-success">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-extrabold text-ink">{t(lang, "successTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t(lang, "successBody")}</p>
      </div>
    );
  }

  return (
    <div className="glass mx-auto mt-10 max-w-md rounded-card p-7 shadow-lg">
      <div className="mb-1 flex items-center gap-2 text-brand">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-wider">{t(lang, "badge")}</span>
      </div>
      <h1 className="text-2xl font-extrabold text-ink">{t(lang, "title")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t(lang, "sub")}</p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <Label>{t(lang, "severityLabel")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSeverity(s.value)}
                className={cn(
                  "rounded-btn border p-3 text-left transition",
                  severity === s.value
                    ? s.value === "URGENT" || s.value === "HIGH"
                      ? "border-danger bg-danger/8"
                      : "border-brand bg-brand/8"
                    : "border-black/10 bg-white hover:border-black/20",
                )}
              >
                <span className="block text-sm font-bold text-ink">{t(lang, s.labelKey)}</span>
                <span className="block text-xs text-muted">{t(lang, s.descKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{t(lang, "concernLabel")}</Label>
          <Textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t(lang, "placeholder")}
          />
        </div>

        <div>
          <Label>{t(lang, "photoLabel")}</Label>
          <label className="flex cursor-pointer items-center gap-2 rounded-btn border border-dashed border-black/20 bg-white px-4 py-3 text-sm text-muted">
            <Camera className="h-4 w-4" />
            {t(lang, "photoHint")}
            <Input type="file" accept="image/*" className="hidden" />
          </label>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "…" : t(lang, "submit")}
        </Button>
        <p className="text-center text-xs text-muted">{t(lang, "footer")}</p>
      </form>
    </div>
  );
}
