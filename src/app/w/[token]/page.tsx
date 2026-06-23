import { EscalationForm } from "@/components/app/escalation-form";
import { getClinicProfile } from "@/lib/data";
import type { Lang } from "@/lib/i18n";

export default async function EscalationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const clinic = await getClinicProfile();
  const lang = (clinic.language === "es" ? "es" : "en") as Lang;
  return (
    <div className="relative min-h-screen">
      <main className="relative z-[1] mx-auto max-w-2xl px-6 py-10">
        <EscalationForm token={token} lang={lang} />
      </main>
    </div>
  );
}
