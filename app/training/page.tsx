import { updateTrainingRecordAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { DistributionChart } from "@/components/DistributionChart";
import { TrainingRecordForm } from "@/components/forms/TrainingRecordForm";
import { getTrainingData } from "@/lib/data";

export default async function TrainingPage() {
  const data = await getTrainingData();

  return (
    <AppShell
      title="Staff Cybersecurity Training"
      description="Assign security awareness training, monitor completion, and identify overdue users before they become operational risk."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.alertCount}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Assigned courses
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{data.rows.length}</p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Completed
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {data.rows.filter((row) => row.completion_status === "completed").length}
          </p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Overdue
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {data.rows.filter((row) => row.completion_status === "overdue").length}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">
            Assign training
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Training records</h3>
          <div className="mt-6">
            <TrainingRecordForm
              users={data.users.map((user) => ({ id: user.id, email: user.email }))}
            />
          </div>
        </article>

        <DistributionChart
          eyebrow="Completion chart"
          title="Training completion by current status"
          color="#34d399"
          data={data.chart}
        />
      </section>

      <article className="glass-panel rounded-[28px] p-6 sm:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
          Assigned training
        </p>
        <div className="mt-7 space-y-4">
          {data.rows.map((row) => (
            <article key={row.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-white">{row.training_name}</h4>
                  <p className="mt-2 text-sm text-slate-400">{row.user_email}</p>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                    Status {row.completion_status.replaceAll("_", " ")} | Completion date{" "}
                    {row.completion_date ?? "Pending"}
                  </p>
                </div>
                <form
                  action={async (formData) => {
                    "use server";
                    await updateTrainingRecordAction(row.id, {
                      completion_status: formData.get("completion_status"),
                      completion_date: formData.get("completion_date") || null,
                    });
                  }}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <select
                    name="completion_status"
                    defaultValue={row.completion_status}
                    className="surface-input rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <input
                    name="completion_date"
                    type="date"
                    defaultValue={row.completion_date ?? ""}
                    className="surface-input rounded-xl px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10"
                  >
                    Save
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </article>
    </AppShell>
  );
}
