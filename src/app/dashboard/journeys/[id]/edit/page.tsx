import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ProtocolBuilder } from "@/components/app/protocol-builder";
import { getProtocol } from "@/lib/data";
import type { ParsedProtocol } from "@/lib/ai/protocol-parser";

export default async function EditProtocolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const protocol = await getProtocol(id);
  if (!protocol) notFound();

  const steps = [...protocol.steps].sort((a, b) => a.offsetMinutes - b.offsetMinutes);
  const initial: ParsedProtocol = {
    name: protocol.name,
    category: protocol.category as ParsedProtocol["category"],
    tone: protocol.tone,
    steps: steps.map((s) => ({
      offsetMinutes: s.offsetMinutes,
      label: s.label,
      body: s.body,
      includeEscalation: s.includeEscalation,
    })),
    source: "heuristic",
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title={`Edit · ${protocol.name}`} description="Refine the messages and timing." />
      <ProtocolBuilder initial={initial} id={protocol.id} />
    </div>
  );
}
