"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2, ChevronRight, Wand2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { smsSegments } from "@/lib/messaging/tokens";
import { parseProtocolAction, saveProtocolAction } from "@/app/dashboard/journeys/actions";
import { isAiAvailable } from "@/lib/ai/protocol-parser";
import type { ParsedProtocol, ParsedStep } from "@/lib/ai/protocol-parser";
import { cn } from "@/lib/utils";

const TONES = ["friendly-medspa", "clinical", "tattoo-shop voice"];

const OFFSET_PRESETS: { label: string; mins: number; stepLabel: string }[] = [
  { label: "Checkout (5m)", mins: 5, stepLabel: "Day 0 · Checkout" },
  { label: "4 hours", mins: 240, stepLabel: "Day 0 · 4h" },
  { label: "Day 1", mins: 1440, stepLabel: "Day 1 · Morning" },
  { label: "Day 3", mins: 4320, stepLabel: "Day 3 · Check-in" },
  { label: "Day 7", mins: 10080, stepLabel: "Day 7 · Progress" },
  { label: "Day 14", mins: 20160, stepLabel: "Day 14 · Results" },
  { label: "Month 3", mins: 129600, stepLabel: "Month 3 · Rebook" },
];

const SAMPLE = `Botox Aftercare
Stay upright for 4 hours after treatment — no lying down.
First 24 hours: don't touch or rub the face, no exercise, no makeup, avoid alcohol.
Day 3: mild bruising or headache is normal and temporary.
Day 7: results start to appear gradually.
Day 14: full results visible. Consider a touch-up if asymmetry.
Swelling that is severe, asymmetric, or painful is not normal — contact us.`;

function emptyProtocol(): ParsedProtocol {
  return { name: "", category: "Other", tone: "friendly-medspa", steps: [], source: "heuristic" };
}

export function ProtocolBuilder({ initial, id }: { initial?: ParsedProtocol; id?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [tone, setTone] = useState("friendly-medspa");
  const [proto, setProto] = useState<ParsedProtocol>(initial ?? emptyProtocol());
  const [stage, setStage] = useState<"input" | "edit">(initial ? "edit" : "input");
  const [parsing, startParsing] = useTransition();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ai = isAiAvailable();

  function handleParse() {
    setError(null);
    startParsing(async () => {
      const result = await parseProtocolAction(text || SAMPLE, tone);
      setProto(result);
      setStage("edit");
    });
  }

  function updateStep(idx: number, patch: Partial<ParsedStep>) {
    setProto((p) => ({
      ...p,
      steps: p.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }

  function addStep(preset?: (typeof OFFSET_PRESETS)[number]) {
    const pr = preset ?? OFFSET_PRESETS[2];
    setProto((p) => ({
      ...p,
      steps: [
        ...p.steps,
        {
          offsetMinutes: pr.mins,
          label: pr.stepLabel,
          body: "",
          includeEscalation: false,
        },
      ].sort((a, b) => a.offsetMinutes - b.offsetMinutes),
    }));
  }

  function removeStep(idx: number) {
    setProto((p) => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }));
  }

  function handleSave() {
    if (!proto.name.trim()) {
      setError("Give your protocol a name before saving.");
      return;
    }
    if (proto.steps.length === 0) {
      setError("Add at least one message step.");
      return;
    }
    startSaving(async () => {
      const { id: savedId } = await saveProtocolAction({
        id,
        name: proto.name,
        category: proto.category,
        tone: proto.tone,
        steps: proto.steps,
      });
      router.push(`/dashboard/journeys/${savedId}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* MAIN */}
      <div className="space-y-5">
        {stage === "input" ? (
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-brand" />
              <h2 className="text-base font-bold text-ink">Turn your aftercare sheet into a journey</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Tone</Label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="h-11 w-full rounded-btn border border-black/12 bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setText(SAMPLE)}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Use sample Botox text →
                </button>
              </div>
            </div>

            <Label className="mt-4">Paste your aftercare instructions (or upload PDF — text below)</Label>
            <Textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full aftercare text here. Include timing like 'Day 1', '4 hours', 'Day 7'…"
              className="font-mono text-xs"
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">
                {ai ? (
                  <span className="inline-flex items-center gap-1 text-success"><Sparkles className="h-3.5 w-3.5" /> AI (GPT-4o) ready</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Smart parser (add OPENAI_API_KEY for AI)</span>
                )}
              </p>
              <Button onClick={handleParse} disabled={parsing}>
                {parsing ? "Generating…" : <><Sparkles className="h-4 w-4" /> Generate journey</>}
              </Button>
            </div>
            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
          </Card>
        ) : (
          <>
            {/* Editable header */}
            <Card className="p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label>Protocol name</Label>
                  <Input value={proto.name} onChange={(e) => setProto({ ...proto, name: e.target.value })} placeholder="e.g. Botox Aftercare" />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={proto.category}
                    onChange={(e) => setProto({ ...proto, category: e.target.value as ParsedProtocol["category"] })}
                    className="h-11 w-full rounded-btn border border-black/12 bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                  >
                    {["Injectables", "Skin", "Body", "Other"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone="brand">{proto.source === "ai" ? "AI-generated" : "Smart-parsed"}</Badge>
                <Badge tone="neutral">{proto.steps.length} messages</Badge>
                <Badge tone="neutral">{proto.tone}</Badge>
              </div>
            </Card>

            {/* Timeline editor */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">Message timeline</h2>
                <Button variant="subtle" size="sm" onClick={() => addStep()}>
                  <Plus className="h-4 w-4" /> Add step
                </Button>
              </div>

              <div className="space-y-4">
                {proto.steps.map((s, idx) => (
                  <div key={idx} className="rounded-card border border-hairline bg-white/60 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <select
                        value={s.offsetMinutes}
                        onChange={(e) => {
                          const mins = Number(e.target.value);
                          const preset = OFFSET_PRESETS.find((p) => p.mins === mins);
                          updateStep(idx, { offsetMinutes: mins, label: preset?.stepLabel ?? s.label });
                        }}
                        className="h-9 rounded-btn border border-black/12 bg-white px-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                      >
                        {OFFSET_PRESETS.map((p) => (
                          <option key={p.mins} value={p.mins}>{p.label}</option>
                        ))}
                      </select>
                      <Input
                        value={s.label}
                        onChange={(e) => updateStep(idx, { label: e.target.value })}
                        className="h-9 w-44 text-xs font-bold"
                      />
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-field">
                        <input
                          type="checkbox"
                          checked={s.includeEscalation}
                          onChange={(e) => updateStep(idx, { includeEscalation: e.target.checked })}
                          className="h-4 w-4 accent-[#e85d2c]"
                        />
                        Escalation
                      </label>
                      <button
                        onClick={() => removeStep(idx)}
                        className="ml-auto grid h-8 w-8 place-items-center rounded-btn text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Textarea
                      rows={2}
                      value={s.body}
                      onChange={(e) => updateStep(idx, { body: e.target.value })}
                      placeholder="Message text… use {{first_name}}, {{clinic_name}}, {{review_link}}…"
                      className="text-sm"
                    />
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
                      <span>{s.body.length} chars</span>
                      <span>{smsSegments(s.body)} SMS segment{smsSegments(s.body) > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStage("input")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : <><Check className="h-4 w-4" /> Save & activate</>}
                </Button>
              </div>
              {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
            </Card>
          </>
        )}
      </div>

      {/* LIVE SMS PREVIEW */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-muted">Live SMS preview</h3>
          <p className="mb-4 text-xs text-muted">How each message lands on the patient's phone</p>
          <div className="space-y-3">
            {proto.steps.length === 0 ? (
              <p className="rounded-card bg-[#f8f8f8] p-4 text-center text-xs text-muted">
                Generate or add steps to see the preview.
              </p>
            ) : (
              proto.steps.map((s, idx) => (
                <div key={idx} className={cn("rounded-card p-3.5 shadow-sm", s.includeEscalation ? "bg-white ring-1 ring-danger/15" : "bg-[#f8f8f8]")}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink">{s.label}</span>
                    {s.includeEscalation && <Badge tone="danger">triage</Badge>}
                  </div>
                  <p className="text-sm leading-snug text-field">
                    {s.body || <span className="italic text-muted">empty message…</span>}
                  </p>
                  {s.includeEscalation && (
                    <span className="mt-2 inline-block rounded-pill bg-brand px-3 py-1 text-xs font-semibold text-white">
                      Something's wrong
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
