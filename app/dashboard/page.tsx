import { updateAlertStatusAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { AiChatbot } from "@/components/ai-chatbot";
import { Charts } from "@/components/Charts";
import { DashboardCards } from "@/components/DashboardCards";
import { getDashboardData } from "@/lib/data";
import { hasPermission } from "@/lib/permissions";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const canEditAlerts = hasPermission(data.currentUser.profile.role, "edit_alert");
  const canViewAuditStream = hasPermission(
    data.currentUser.profile.role,
    "view_dashboard_audit_stream",
  );

  return (
    <AppShell
      title="Security Operations Dashboard"
      description="Monitor cyber posture trends, identify concentration of risk, and keep remediation aligned with compliance priorities."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.openAlerts.length}
    >
      <AiChatbot />

      <section className="glass-panel overflow-hidden rounded-[32px] p-6 sm:p-7">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal-300">
              Executive posture
            </p>
            <h3 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Security operations, compliance exposure, and recovery readiness in one view.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/85">
              Use the live metrics below to prioritize the riskiest assets first, keep backup
              confidence visible, and move active investigations without losing compliance context.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="panel-subtle rounded-[24px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Security score
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {data.summary.securityScore}%
              </p>
            </div>
            <div className="panel-subtle rounded-[24px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Compliance score
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {data.summary.complianceScore}%
              </p>
            </div>
            <div className="rounded-[24px] border border-rose-300/16 bg-gradient-to-br from-rose-400/16 to-orange-400/10 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose-100">
                Open alerts
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.openAlerts.length}</p>
            </div>
          </div>
        </div>
      </section>

      <DashboardCards metrics={data.metrics} />

      <Charts
        riskTrendSeries={data.riskTrendSeries}
        severitySeries={data.severitySeries}
        incidentStatusSeries={data.incidentStatusSeries}
        trainingCompletionSeries={data.trainingCompletionSeries}
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-panel rounded-[28px] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
                Device watchlist
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Highest-risk assets under active observation
              </h3>
            </div>
          </div>
          <div className="table-scroll mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Device</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Risk</th>
                  <th className="pb-3 font-medium">Findings</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {data.devices.slice(0, 6).map((device) => (
                  <tr key={device.id} className="border-t border-white/8 align-top">
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-medium text-white">{device.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          Added {new Date(device.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 capitalize">{device.type.replaceAll("_", " ")}</td>
                    <td className="py-4 pr-4 capitalize">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em]">
                        {device.risk_level}
                      </span>
                    </td>
                    <td className="py-4">{device.vulnerability_count}</td>
                  </tr>
                ))}
                {data.devices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-slate-400">
                      No devices recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="glass-panel rounded-[28px] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-rose-300">
            Security alerts
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Active notifications requiring attention
          </h3>
          <div className="mt-6 space-y-4">
            {data.openAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">{alert.title}</p>
                      <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-100">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{alert.message}</p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                      Created {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  {canEditAlerts ? (
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateAlertStatusAction(alert.id, formData.get("status") as string);
                      }}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center"
                    >
                      <select
                        name="status"
                        defaultValue={alert.status}
                        className="surface-input rounded-xl px-3 py-2 text-sm text-white"
                      >
                        <option value="open">Open</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                      {alert.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {data.openAlerts.length === 0 ? (
              <p className="text-sm text-slate-400">No active security alerts right now.</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-orange-300">
            Backup monitoring
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Latest backup posture</h3>
          {data.summary.latestBackup ? (
            <div className="mt-6 space-y-3 rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
              <p className="text-3xl font-semibold text-white">
                {data.summary.latestBackup.status[0].toUpperCase() +
                  data.summary.latestBackup.status.slice(1)}
              </p>
              <p className="text-sm leading-6 text-slate-400">
                Last backup {new Date(data.summary.latestBackup.last_backup_time).toLocaleString()}
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                Size {data.summary.latestBackup.backup_size} GB
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">No backup jobs recorded yet.</p>
          )}
        </article>

        {canViewAuditStream ? (
          <article className="glass-panel rounded-[28px] p-6 sm:p-7">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Audit stream
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Recent platform activity</h3>
            <div className="mt-6 space-y-4">
              {data.auditLogs.map((log) => (
                <div
                  key={`${log.created_at}-${log.action}`}
                  className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
                >
                  <p className="text-sm font-medium text-white">{log.action.replaceAll(":", " / ")}</p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {data.auditLogs.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Audit activity will appear here once the team starts using the platform.
                </p>
              ) : null}
            </div>
          </article>
        ) : null}
      </section>
    </AppShell>
  );
}
