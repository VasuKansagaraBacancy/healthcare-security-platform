import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import type { NavigationItem } from "@/lib/navigation";

interface NavbarProps {
  title: string;
  description: string;
  organizationName?: string | null;
  userEmail: string;
  notificationCount?: number;
  navigation: NavigationItem[];
}

export function Navbar({
  title,
  description,
  organizationName,
  userEmail,
  notificationCount,
  navigation,
}: NavbarProps) {
  return (
    <header className="glass-panel overflow-hidden rounded-[32px] p-5 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)] xl:items-start">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(45,212,191,0.7)]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-teal-100">
              {organizationName ?? "Healthcare security"}
            </p>
          </div>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl xl:text-[2.2rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/85">{description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="panel-subtle rounded-[24px] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Session
                </p>
                <p className="mt-2 break-all text-sm font-medium text-white">{userEmail}</p>
              </div>
              <LogoutButton />
            </div>
          </div>

          {typeof notificationCount === "number" ? (
            <div className="rounded-[24px] border border-rose-300/18 bg-gradient-to-br from-rose-400/16 to-orange-300/8 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-rose-100">
                Open alerts
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-white">{notificationCount}</p>
                  <p className="mt-1 text-sm text-slate-200/80">
                    Notifications requiring review
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                  SOC
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden xl:grid-cols-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-[11px] uppercase tracking-[0.18em] text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
