"use server";

import { revalidatePath } from "next/cache";
import { parseProtocolFromText, type ParsedProtocol, type ParsedStep } from "@/lib/ai/protocol-parser";
import { getLiveStore } from "@/lib/data/store";
import { nanoid } from "nanoid";
import type { Protocol, ProtocolStep } from "@/lib/data/types";

export async function parseProtocolAction(
  text: string,
  tone: string,
): Promise<ParsedProtocol> {
  return parseProtocolFromText(text, { tone });
}

export interface SaveProtocolInput {
  id?: string;
  name: string;
  category: string;
  segment?: string;
  tone: string;
  steps: ParsedStep[];
}

export async function saveProtocolAction(input: SaveProtocolInput): Promise<{ id: string }> {
  const store = getLiveStore();
  const id = input.id ?? `proto_${nanoid(10)}`;
  const now = new Date().toISOString();

  const steps: ProtocolStep[] = input.steps.map((s, i) => ({
    id: `${id}-s${i + 1}`,
    protocolId: id,
    order: i + 1,
    offsetMinutes: s.offsetMinutes,
    label: s.label,
    body: s.body,
    includeEscalation: s.includeEscalation,
    includeReviewAsk: false,
    includeRebook: false,
  }));

  // Mark last review/rebook if tokens present
  if (steps.length) {
    const last = steps[steps.length - 1];
    if (last.body.includes("{{review_link}}")) last.includeReviewAsk = true;
    if (last.body.includes("{{book_link}}")) last.includeRebook = true;
  }

  const existingIdx = store.protocols.findIndex((p) => p.id === id);
  const protocol: Protocol = {
    id,
    orgId: store.org.id,
    name: input.name,
    category: input.category,
    segment: input.segment,
    source: existingIdx >= 0 ? store.protocols[existingIdx].source : "AI_IMPORTED",
    status: "ACTIVE",
    tone: input.tone,
    version: existingIdx >= 0 ? store.protocols[existingIdx].version + 1 : 1,
    steps,
    createdAt: existingIdx >= 0 ? store.protocols[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) store.protocols[existingIdx] = protocol;
  else store.protocols.push(protocol);

  revalidatePath("/dashboard/journeys");
  revalidatePath(`/dashboard/journeys/${id}`);
  return { id };
}

export async function deleteProtocolAction(id: string): Promise<void> {
  const store = getLiveStore();
  store.protocols = store.protocols.filter((p) => p.id !== id);
  revalidatePath("/dashboard/journeys");
}
