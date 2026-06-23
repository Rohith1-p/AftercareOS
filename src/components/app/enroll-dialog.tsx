"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { enrollPatientAction } from "@/app/dashboard/patients/actions";
import type { Patient, Protocol } from "@/lib/data/types";

export function EnrollDialog({
  patients,
  protocols,
  triggerLabel = "Enroll patient",
  defaultPatientId,
}: {
  patients: Patient[];
  protocols: Protocol[];
  triggerLabel?: string;
  defaultPatientId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [isNew, setIsNew] = useState(!defaultPatientId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");
  const [protocolId, setProtocolId] = useState(protocols[0]?.id ?? "");
  const [procedureLabel, setProcedureLabel] = useState("");
  const [when, setWhen] = useState("now");
  const [sendNow, setSendNow] = useState(true);

  const appointmentAt =
    when === "now" ? new Date().toISOString() : new Date(when).toISOString();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { patientId: pid } = await enrollPatientAction({
        patientId: isNew ? undefined : patientId,
        name: isNew ? name : undefined,
        phone,
        protocolId,
        procedureLabel: procedureLabel || undefined,
        appointmentAt,
        sendNow,
      });
      setOpen(false);
      router.push(`/dashboard/patients/${pid}`);
      router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> {triggerLabel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-card bg-cream p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-extrabold text-ink">Enroll patient</Dialog.Title>
            <Dialog.Close asChild>
              <button className="grid h-8 w-8 place-items-center rounded-pill text-muted hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsNew(true)}
                className={`flex-1 rounded-btn border px-3 py-2 text-xs font-semibold ${isNew ? "border-brand bg-brand/10 text-brand" : "border-black/10 text-muted"}`}
              >
                New patient
              </button>
              <button
                type="button"
                onClick={() => setIsNew(false)}
                disabled={patients.length === 0}
                className={`flex-1 rounded-btn border px-3 py-2 text-xs font-semibold ${!isNew ? "border-brand bg-brand/10 text-brand" : "border-black/10 text-muted"}`}
              >
                Existing ({patients.length})
              </button>
            </div>

            {isNew ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Mitchell" required />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 100-2003" required />
                </div>
              </div>
            ) : (
              <div>
                <Label>Patient</Label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="h-11 w-full rounded-btn border border-black/12 bg-white px-3 text-sm focus:border-brand focus:outline-none"
                  required
                >
                  <option value="">Select a patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Protocol */}
            <div>
              <Label>Protocol</Label>
              <select
                value={protocolId}
                onChange={(e) => setProtocolId(e.target.value)}
                className="h-11 w-full rounded-btn border border-black/12 bg-white px-3 text-sm focus:border-brand focus:outline-none"
                required
              >
                {protocols.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Procedure label</Label>
                <Input value={procedureLabel} onChange={(e) => setProcedureLabel(e.target.value)} placeholder="Botox · Forehead" />
              </div>
              <div>
                <Label>Appointment time</Label>
                <select
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="h-11 w-full rounded-btn border border-black/12 bg-white px-3 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="now">Now (just finished)</option>
                  <option value="1h">1 hour ago</option>
                  <option value="today">Earlier today</option>
                  <option value="yesterday">Yesterday</option>
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-btn bg-brand/5 p-3 text-sm">
              <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} className="h-4 w-4 accent-[#e85d2c]" />
              <span className="font-semibold text-ink">Send the first message now</span>
              <span className="text-muted">(great for live demos)</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" size="sm">Cancel</Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? "Enrolling…" : <><Sparkles className="h-4 w-4" /> Start journey</>}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
