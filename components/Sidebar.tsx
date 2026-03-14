"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDeferredValue } from "react";
import type { NavigationItem } from "@/lib/navigation";

export function Sidebar({ navigation }: { navigation: NavigationItem[] }) {
  const pathname = usePathname();
  const deferredPathname = useDeferredValue(pathname);

  return (
    <aside className="glass-panel hidden min-h-[calc(100vh-3rem)] w-80 shrink-0 rounded-[32px] p-6 lg:sticky lg:top-6 lg:block">
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-teal-300/10 via-white/[0.05] to-orange-300/10 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-300">
          Healthcare cyber
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          Risk management platform
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Track security posture, triage incidents, and prepare audit evidence from one command
          center.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="metric-chip rounded-2xl p-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Focus
            </p>
            <p className="mt-2 text-sm font-medium text-white">Clinical resilience</p>
          </div>
          <div className="metric-chip rounded-2xl p-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Mode
            </p>
            <p className="mt-2 text-sm font-medium text-white">Enterprise ops</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="px-2 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Navigation
        </p>
      </div>

      <nav className="mt-3 space-y-2">
        {navigation.map((item) => {
          const active = deferredPathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-sm transition ${
                active
                  ? "border-teal-300/40 bg-gradient-to-r from-teal-300/14 to-cyan-300/8 text-white shadow-[0_12px_35px_rgba(20,184,166,0.12)]"
                  : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-1 font-mono text-[11px] ${
                  active ? "bg-white/10 text-white" : "bg-white/5 text-slate-400"
                }`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-[28px] border border-orange-400/20 bg-gradient-to-br from-orange-400/12 to-rose-400/8 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-orange-300">
          Priority
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-white">
          Investigate critical vulnerabilities on medical devices first.
        </p>
        <p className="mt-3 text-xs leading-6 text-slate-300/75">
          Use the risk, incidents, and vendor views together when triaging exposure.
        </p>
      </div>
    </aside>
  );
}
