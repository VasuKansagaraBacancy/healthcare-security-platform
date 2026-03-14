import { updateVendorAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { VendorForm } from "@/components/forms/VendorForm";
import { getVendorData } from "@/lib/data";

export default async function VendorsPage() {
  const data = await getVendorData();

  return (
    <AppShell
      title="Vendor Security Management"
      description="Track external partners, monitor vendor risk posture, and keep compliance status visible across third-party relationships."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.alertCount}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Total vendors
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{data.vendors.length}</p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            High risk vendors
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {data.vendors.filter((vendor) => ["high", "critical"].includes(vendor.risk_level)).length}
          </p>
        </article>
        <article className="panel-subtle rounded-[24px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Compliant vendors
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {data.vendors.filter((vendor) => vendor.compliance_status === "compliant").length}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal-300">
            Add vendor
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Third-party inventory</h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Record healthcare technology vendors, classify risk, and monitor compliance status.
          </p>
          <div className="mt-6">
            <VendorForm />
          </div>
        </article>

        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Vendor register
          </p>
          <div className="mt-7 space-y-4">
            {data.vendors.map((vendor) => (
              <article key={vendor.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-lg font-semibold text-white">{vendor.name}</h4>
                    <p className="mt-2 text-sm text-slate-400">{vendor.contact_email}</p>
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                      Risk {vendor.risk_level} | Compliance {vendor.compliance_status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateVendorAction(vendor.id, {
                        risk_level: formData.get("risk_level"),
                        compliance_status: formData.get("compliance_status"),
                      });
                    }}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <select
                      name="risk_level"
                      defaultValue={vendor.risk_level}
                      className="surface-input rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <select
                      name="compliance_status"
                      defaultValue={vendor.compliance_status}
                      className="surface-input rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="compliant">Compliant</option>
                      <option value="in_progress">In progress</option>
                      <option value="at_risk">At risk</option>
                      <option value="non_compliant">Non-compliant</option>
                    </select>
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
      </section>
    </AppShell>
  );
}
