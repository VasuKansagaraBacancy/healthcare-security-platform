import { AppShell } from "@/components/AppShell";
import { getAuditActivityData } from "@/lib/data";
import { auditLogQuerySchema } from "@/lib/validation";

interface AuditLogsPageProps {
  searchParams: Promise<{ user?: string; action?: string }>;
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = auditLogQuerySchema.parse(await searchParams);
  const data = await getAuditActivityData(params);

  return (
    <AppShell
      title="Access Control Monitoring"
      description="Review user activity across the platform, filter by actor and action, and maintain an access trail for audit readiness."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.alertCount}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Visible records
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{data.rows.length}</p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Active users
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{data.users.length}</p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Filter status
          </p>
          <p className="mt-3 text-sm font-medium text-white">
            {params.user || params.action ? "Custom filter applied" : "Showing full activity stream"}
          </p>
        </article>
      </section>

      <article className="glass-panel rounded-[28px] p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Filters
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">User activity logs</h3>
          </div>
          <form className="grid gap-3 sm:grid-cols-3">
            <select
              name="user"
              defaultValue={params.user ?? ""}
              className="surface-input rounded-2xl px-4 py-3 text-sm text-white"
            >
              <option value="">All users</option>
              {data.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            <input
              name="action"
              defaultValue={params.action ?? ""}
              placeholder="Filter action"
              className="surface-input rounded-2xl px-4 py-3 text-sm text-white"
            />
            <button
              type="submit"
              className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
            >
              Apply
            </button>
          </form>
        </div>

        <div className="table-scroll mt-7 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Module</th>
                <th className="pb-3 font-medium">IP address</th>
                <th className="pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t border-white/8">
                  <td className="py-4 pr-4">
                    <p className="font-medium text-white">{row.user_email}</p>
                  </td>
                  <td className="py-4 pr-4">{row.action}</td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em]">
                      {row.module}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{row.ip_address ?? "Unknown"}</td>
                  <td className="py-4">{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </AppShell>
  );
}
