"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Users,
  MessageSquare,
  Star,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/journeys", label: "Journeys", icon: Route },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare, badge: true },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-white lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="text-brand text-xl">◆</span>
        <span className="text-[17px] font-extrabold tracking-tight">AftercareOS</span>
      </div>

      {/* New enroll CTA */}
      <div className="px-4 pb-2">
        <Button asChild variant="primary" size="sm" className="w-full">
          <Link href="/dashboard/patients?enroll=1">
            <Plus className="h-4 w-4" /> Enroll patient
          </Link>
        </Button>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition",
                  active ? "bg-brand" : "bg-transparent",
                )}
              />
              <Icon className={cn("h-[18px] w-[18px]", active && "text-brand")} />
              <span>{item.label}</span>
              {item.badge && unread > 0 && (
                <span className="ml-auto rounded-pill bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer plan badge */}
      <div className="border-t border-white/10 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Plan</p>
        <p className="mt-0.5 text-sm font-bold text-white">Professional · Trial</p>
      </div>
    </aside>
  );
}
