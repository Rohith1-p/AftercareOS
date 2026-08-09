import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { KeepAlive } from "@/components/app/keep-alive";
import { getClinicProfile, getConversations } from "@/lib/data";

// Every dashboard page renders live clinic data, so none of them can be
// prerendered at build time — doing so made `next build` query Supabase from
// the build worker and fail the whole export. Applies to all nested routes.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clinic, conversations] = await Promise.all([
    getClinicProfile(),
    getConversations(),
  ]);
  const unread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="relative min-h-screen">
      <Sidebar unread={unread} />
      <div className="lg:pl-64">
        <Topbar clinicName={clinic.name} userName="Alex Rivera" />
        <main className="relative z-[1] mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
      <KeepAlive />
    </div>
  );
}
