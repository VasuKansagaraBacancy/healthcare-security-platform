import { AppShell } from "@/components/AppShell";
import { VulnerabilityForm } from "@/components/forms/VulnerabilityForm";
import { updateVulnerabilityStatusAction } from "@/app/actions";
import { getDashboardData } from "@/lib/data";

interface VulnerabilitiesPageProps {
  searchParams: Promise<{ severity?: string }>;
}

export default async function VulnerabilitiesPage({
  searchParams,
}: VulnerabilitiesPageProps) {
  const params = await searchParams;
  const data = await getDashboardData();
  const severityFilter = params.severity;
  const rows = severityFilter
    ? data.vulnerabilities.filter((item) => item.severity === severityFilter)
    : data.vulnerabilities;

  return (
    <AppShell
      title="Vulnerability Management"
      description="Track findings by severity, link them to affected devices, and progress remediation status without losing audit visibility."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.openAlerts.length}
    >
      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="glass-panel rounded-[28px] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal-300">
            Log finding
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Add vulnerability</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Assign a severity rating, bind the finding to an affected device, and use RLS-protected workflows to keep data scoped to the organization.
          </p>
          <div className="mt-6">
            <VulnerabilityForm
              devices={data.devices.map((device) => ({ id: device.id, name: device.name }))}
            />
          </div>
        </article>

        <article className="glass-panel rounded-[28px] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
                Findings
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Open and historical vulnerabilities</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {["all", "low", "medium", "high", "critical"].map((value) => (
                <a
                  key={value}
                  href={value === "all" ? "/vulnerabilities" : `/vulnerabilities?severity=${value}`}
                  className={`rounded-full border px-3 py-2 uppercase tracking-[0.18em] ${
                    (severityFilter ?? "all") === value
                      ? "border-teal-300/40 bg-teal-300/10 text-teal-100"
                      : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  {value}
                </a>
              ))}
            </div>
          </div>

          <div className="table-scroll mt-6 overflow-x-auto">
            <table className="min-w-[720px] text-left text-sm sm:min-w-full">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Device</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-white/8 align-top">
                    <td className="py-3">
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    </td>
                    <td className="py-3">
                      <p>{item.device_name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {item.device_risk_level}
                      </p>
                    </td>
                    <td className="py-3 capitalize">{item.severity}</td>
                    <td className="py-3">
                      <form
                        action={async (formData) => {
                          "use server";
                          await updateVulnerabilityStatusAction(
                            item.id,
                            formData.get("status") as string,
                          );
                        }}
                        className="flex min-w-[160px] flex-col gap-2 sm:flex-row sm:items-center"
                      >
                        <select
                          name="status"
                          defaultValue={item.status}
                          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white"
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="remediated">Remediated</option>
                          <option value="accepted_risk">Accepted risk</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-200"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-slate-400">
                      No vulnerabilities match the current filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
