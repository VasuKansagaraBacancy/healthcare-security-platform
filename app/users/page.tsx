import { AppShell } from "@/components/AppShell";
import { updateUserRoleAction } from "@/app/actions";
import { getOrganizationUsers } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

export default async function UsersPage() {
  await requireAdmin();
  const data = await getOrganizationUsers();

  return (
    <AppShell
      title="User Administration"
      description="Manage organization access by reviewing users and assigning the right operational role for each person."
      organizationName={data.currentUser.organization?.name}
      userEmail={data.currentUser.email}
      notificationCount={data.alertCount}
    >
      <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal-300">
            Admin controls
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Organization roles</h3>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              `Admin` can manage user roles and all security modules.
            </p>
            <p>
              `Analyst` can work day-to-day on devices, vulnerabilities, incidents, compliance, and reports.
            </p>
            <p>
              `Auditor` keeps read access for oversight and evidence review.
            </p>
          </div>
          <div className="mt-6 rounded-3xl border border-orange-400/20 bg-orange-400/8 p-5 text-sm text-slate-300">
            Invite and account deletion are not enabled in this build. Current admin controls cover
            role governance for users already registered into the organization.
          </div>
        </article>

        <article className="glass-panel rounded-[28px] p-6 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Organization users
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Access directory</h3>

          <div className="table-scroll mt-7 overflow-x-auto">
            <table className="min-w-[720px] text-left text-sm sm:min-w-full">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {data.users.map((user) => (
                  <tr key={user.id} className="border-t border-white/8 align-top">
                    <td className="py-4 pr-5">
                      <p className="break-all font-medium text-white">{user.email}</p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                        {user.id === data.currentUser.profile.id ? "Current session" : "Organization member"}
                      </p>
                    </td>
                    <td className="py-4 pr-5 capitalize">{user.role}</td>
                    <td className="py-4 pr-5">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      <form
                        action={async (formData) => {
                          "use server";
                          await updateUserRoleAction(user.id, formData.get("role") as string);
                        }}
                        className="flex min-w-[160px] flex-col gap-2 sm:flex-row sm:items-center"
                      >
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="analyst">Analyst</option>
                          <option value="auditor">Auditor</option>
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
                {data.users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-slate-400">
                      No users found for this organization yet.
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
