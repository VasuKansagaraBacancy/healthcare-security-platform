import type { DashboardMetric } from "@/types/database";

const toneClasses: Record<DashboardMetric["tone"], string> = {
  positive: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  critical: "border-rose-300/20 bg-rose-300/10 text-rose-100",
  neutral: "border-slate-300/10 bg-white/5 text-slate-100",
};

export function DashboardCards({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric, index) => (
        <article
          key={metric.label}
          className={`relative overflow-hidden rounded-[30px] border px-5 py-6 shadow-lg sm:px-6 sm:py-7 ${toneClasses[metric.tone]}`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
          <p className="font-mono text-xs uppercase tracking-[0.24em] opacity-80">
            {metric.label}
          </p>
          <div className="mt-8 flex items-end justify-between gap-3">
            <p className="text-4xl font-semibold tracking-tight sm:text-[2.8rem]">{metric.value}</p>
            <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em]">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-5 h-px bg-white/10" />
          <p className="mt-4 text-sm leading-6 opacity-80">{metric.change}</p>
        </article>
      ))}
    </section>
  );
}
