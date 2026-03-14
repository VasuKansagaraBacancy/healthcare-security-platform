import { AppShell } from "@/components/AppShell";
import { ComplianceForm } from "@/components/forms/ComplianceForm";
import { updateComplianceCheckAction } from "@/app/actions";
import { getDashboardData } from "@/lib/data";

export default async function CompliancePage() {
  const data = await getDashboardData();

  return (
    <AppShell
      title="Compliance Dashboard"
      description="Measure readiness against healthcare security controls, keep remediation visible, and track scoring progress over time."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.openAlerts.length}
    >
      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal-300">
            Compliance score
          </p>
          <h3 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            {data.summary.complianceScore}%
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Average score across configured controls. Use the checklist to reflect control health
            and remediation progress.
          </p>
          <div className="mt-6">
            <ComplianceForm />
          </div>
        </article>

        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Checklist
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Control tracking</h3>
          <div className="mt-7 space-y-5">
            {data.complianceChecks.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-lg font-semibold text-white">{item.name}</h4>
                    <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                      Score {item.score} | Status {item.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateComplianceCheckAction(item.id, {
                        status: formData.get("status"),
                        score: Number(formData.get("score")),
                      });
                    }}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <select
                      name="status"
                      defaultValue={item.status}
                      className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white"
                    >
                      <option value="compliant">Compliant</option>
                      <option value="in_progress">In progress</option>
                      <option value="at_risk">At risk</option>
                      <option value="non_compliant">Non-compliant</option>
                    </select>
                    <input
                      name="score"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={item.score}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white sm:w-24"
                    />
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
            {data.complianceChecks.length === 0 ? (
              <p className="text-sm text-slate-400">No compliance checks recorded yet.</p>
            ) : null}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
