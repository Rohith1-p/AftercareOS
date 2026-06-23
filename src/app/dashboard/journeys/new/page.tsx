import { PageHeader } from "@/components/app/page-header";
import { ProtocolBuilder } from "@/components/app/protocol-builder";

export default function NewProtocolPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="New protocol"
        description="Upload a PDF, paste your aftercare text, or start from a sample. AI builds the timed journey — you refine it."
      />
      <ProtocolBuilder />
    </div>
  );
}
