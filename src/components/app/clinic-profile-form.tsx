"use client";

import { useState, useTransition } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { saveClinicProfileAction } from "@/app/dashboard/settings/actions";
import type { ClinicProfile } from "@/lib/data/types";

export function ClinicProfileForm({ initial }: { initial: ClinicProfile }) {
  const [form, setForm] = useState({
    name: initial.name,
    senderName: initial.senderName ?? "",
    brandColor: initial.brandColor,
    bookingUrl: initial.bookingUrl ?? "",
    reviewLink: initial.reviewLink ?? "",
    quietHoursStart: initial.quietHoursStart ?? "21:00",
    quietHoursEnd: initial.quietHoursEnd ?? "07:00",
    consentText: initial.consentText ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await saveClinicProfileAction(form);
      setSaved(true);
    });
  }

  return (
    <form onSubmit={save} className="px-6 py-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Clinic name</Label>
          <Input value={form.name} data-testid="clinic-name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Sender name (SMS signature)</Label>
          <Input value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} placeholder="Glow Aesthetics" />
        </div>
        <div>
          <Label>Brand color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.brandColor}
              onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
              className="h-11 w-12 cursor-pointer rounded-btn border border-black/12 bg-white p-1"
            />
            <Input value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Quiet from</Label>
            <Input type="time" value={form.quietHoursStart} onChange={(e) => setForm({ ...form, quietHoursStart: e.target.value })} />
          </div>
          <div>
            <Label>Quiet until</Label>
            <Input type="time" value={form.quietHoursEnd} onChange={(e) => setForm({ ...form, quietHoursEnd: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Booking URL</Label>
          <Input value={form.bookingUrl} onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })} placeholder="https://glow.book.app" />
        </div>
        <div>
          <Label>Google review link</Label>
          <Input value={form.reviewLink} onChange={(e) => setForm({ ...form, reviewLink: e.target.value })} placeholder="https://g.page/r/.../review" />
        </div>
      </div>
      <div className="mt-3">
        <Label>Consent / disclaimer text</Label>
        <Textarea
          rows={2}
          value={form.consentText}
          onChange={(e) => setForm({ ...form, consentText: e.target.value })}
          placeholder="Message & data rates may apply. Reply STOP to opt out."
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : <><Save className="h-4 w-4" /> Save changes</>}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
