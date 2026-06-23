import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EnrollDialog } from "@/components/app/enroll-dialog";
import { getPatients, getEnrollments, getProtocols, dayBucketLabel } from "@/lib/data";
import { maskPhone, formatDate } from "@/lib/utils";

export default async function PatientsPage() {
  const [patients, enrollments, protocols] = await Promise.all([
    getPatients(),
    getEnrollments(),
    getProtocols(),
  ]);
  const protoName = (id: string) => protocols.find((p) => p.id === id)?.name ?? "Protocol";

  const rows = patients.map((p) => {
    const enr = enrollments
      .filter((e) => e.patientId === p.id)
      .sort((a, b) => +new Date(b.appointmentAt) - +new Date(a.appointmentAt))[0];
    const enrolled = Boolean(enr);
    return {
      ...p,
      lastProcedure: enr?.procedureLabel ?? protoName(enr?.protocolId ?? "") ?? "—",
      status: (enr?.status ?? "NONE") as string,
      day: enr ? dayBucketLabel(enr.currentOffsetMin) : null,
      enrolled,
    };
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Patients & Enrollments"
        description="See who's in an aftercare journey and enroll a new patient."
        action={<EnrollDialog patients={patients} protocols={protocols} />}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-6 py-3 font-bold">Patient</th>
                <th className="px-6 py-3 font-bold">Phone</th>
                <th className="px-6 py-3 font-bold">Last procedure</th>
                <th className="px-6 py-3 font-bold">Day</th>
                <th className="px-6 py-3 font-bold">Status</th>
                <th className="px-6 py-3 font-bold">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-black/[0.02]">
                  <td className="px-6 py-3.5">
                    <Link href={`/dashboard/patients/${r.id}`} className="font-semibold text-ink hover:text-brand">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{maskPhone(r.phone)}</td>
                  <td className="px-6 py-3.5 text-field">{r.lastProcedure}</td>
                  <td className="px-6 py-3.5">{r.day ? <Badge tone="brand">{r.day}</Badge> : <span className="text-muted">—</span>}</td>
                  <td className="px-6 py-3.5">
                    {r.status === "NONE" ? <span className="text-muted">Not enrolled</span> : <StatusBadge status={r.status as never} />}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-muted">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted">
            <Users className="mx-auto mb-2 h-6 w-6" />
            No patients yet. Connect Square or enroll manually.
          </div>
        )}
      </Card>
    </div>
  );
}
