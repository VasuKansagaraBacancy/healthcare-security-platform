import { AppShell } from "@/components/AppShell";
import { DeviceForm } from "@/components/forms/DeviceForm";
import { getOrgScopedData } from "@/lib/data";

export default async function DevicesPage() {
  const data = await getOrgScopedData();

  return (
    <AppShell
      title="Device Inventory"
      description="Maintain a current asset inventory for clinical and corporate systems, along with risk posture and exposure counts."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.openAlerts.length}
    >
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal-300">
            Add device
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Capture a new asset</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Record medical devices, servers, workstations, and cloud assets with a current risk rating.
          </p>
          <div className="mt-6">
            <DeviceForm />
          </div>
        </article>

        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Inventory
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Organization devices
          </h3>
          <div className="table-scroll mt-7 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Risk</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {data.devices.map((device) => (
                  <tr key={device.id} className="border-t border-white/8">
                    <td className="py-4 pr-4">{device.name}</td>
                    <td className="py-4 pr-4 capitalize">{device.type.replaceAll("_", " ")}</td>
                    <td className="py-4 pr-4 capitalize">{device.risk_level}</td>
                    <td className="py-4">{new Date(device.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {data.devices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-slate-400">
                      No devices have been added yet.
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
