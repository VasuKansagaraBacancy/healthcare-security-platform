import { AppShell } from "@/components/AppShell";
import { MetricTrendChart } from "@/components/MetricTrendChart";
import { getRiskData } from "@/lib/data";

export default async function RiskPage() {
  const data = await getRiskData();

  return (
    <AppShell
      title="Risk Assessment Engine"
      description="Track the weighted cybersecurity risk score derived from critical, high, and medium vulnerabilities plus currently open incidents."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.alertCount}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Current score
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{data.currentRisk?.risk_score ?? 0}</p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Critical findings
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {data.currentRisk?.critical_vulnerabilities ?? 0}
          </p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Open incidents
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {data.currentRisk?.open_incidents ?? 0}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-rose-300">Formula</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Current risk score inputs</h3>
          <div className="mt-6 space-y-4 rounded-3xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-5xl font-semibold text-white">{data.currentRisk?.risk_score ?? 0}</p>
            <p className="text-sm leading-7 text-slate-400">
              Risk Score = (critical vulnerabilities x 5) + (high vulnerabilities x 3) + (medium
              vulnerabilities x 2) + (open incidents x 4)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Critical vulnerabilities</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {data.currentRisk?.critical_vulnerabilities ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">High vulnerabilities</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {data.currentRisk?.high_vulnerabilities ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Medium vulnerabilities</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {data.currentRisk?.medium_vulnerabilities ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Open incidents</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {data.currentRisk?.open_incidents ?? 0}
                </p>
              </div>
            </div>
          </div>
        </article>

        <MetricTrendChart
          eyebrow="Risk trend"
          title="Historical weighted risk score"
          color="#fb7185"
          data={data.trend}
        />
      </section>

      <article className="glass-panel rounded-[28px] p-6 sm:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
          Assessment history
        </p>
        <div className="table-scroll mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Recorded</th>
                <th className="pb-3 font-medium">Risk score</th>
                <th className="pb-3 font-medium">Critical</th>
                <th className="pb-3 font-medium">High</th>
                <th className="pb-3 font-medium">Medium</th>
                <th className="pb-3 font-medium">Open incidents</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {data.history.map((item) => (
                <tr key={item.id} className="border-t border-white/8">
                  <td className="py-4 pr-4">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="py-4 pr-4">{item.risk_score}</td>
                  <td className="py-4 pr-4">{item.critical_vulnerabilities}</td>
                  <td className="py-4 pr-4">{item.high_vulnerabilities}</td>
                  <td className="py-4 pr-4">{item.medium_vulnerabilities}</td>
                  <td className="py-4">{item.open_incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
