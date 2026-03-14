import { AppShell } from "@/components/AppShell";
import { IncidentForm } from "@/components/forms/IncidentForm";
import { updateIncidentStatusAction } from "@/app/actions";
import { getOrgScopedData } from "@/lib/data";

export default async function IncidentsPage() {
  const data = await getOrgScopedData();

  return (
    <AppShell
      title="Incident Management"
      description="Report security incidents, classify severity, and drive status changes from open through closure with a visible response backlog."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.openAlerts.length}
    >
      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-orange-300">
            Report incident
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Create incident record</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Capture response notes early so the team has a shared record of severity, impact, and
            containment state.
          </p>
          <div className="mt-6">
            <IncidentForm />
          </div>
        </article>

        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Active workload
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Incident queue</h3>
          <div className="mt-7 space-y-5">
            {data.incidents.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                      Severity {item.severity} | Created {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateIncidentStatusAction(item.id, formData.get("status") as string);
                    }}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <select
                      name="status"
                      defaultValue={item.status}
                      className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white"
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="mitigated">Mitigated</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-200"
                    >
                      Save
                    </button>
                  </form>
                </div>
              </article>
            ))}
            {data.incidents.length === 0 ? (
              <p className="text-sm text-slate-400">No incidents have been reported yet.</p>
            ) : null}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
