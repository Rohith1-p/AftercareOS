import { Bell, Search } from "lucide-react";
import { initials } from "@/lib/utils";

export function Topbar({ clinicName, userName }: { clinicName: string; userName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-white/70 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Mobile brand */}
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-brand text-lg">◆</span>
          <span className="font-extrabold text-ink">AftercareOS</span>
        </div>

        <div className="relative hidden flex-1 max-w-sm md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search patients, protocols…"
            className="h-10 w-full rounded-pill border border-black/10 bg-white pl-9 pr-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-ink sm:block">{clinicName}</span>
          <button className="relative grid h-10 w-10 place-items-center rounded-pill text-ink hover:bg-black/5">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-pill bg-brand text-sm font-bold text-white">
            {initials(userName)}
          </div>
        </div>
      </div>
    </header>
  );
}
