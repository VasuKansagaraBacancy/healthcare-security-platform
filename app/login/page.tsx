import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { SetupNotice } from "@/components/SetupNotice";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <main className="section-grid min-h-screen p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-[32px] p-8 sm:p-10 lg:p-12">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-300">
            Access command center
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Login</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Authenticate with Supabase Auth to access organization-scoped security data.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass-panel rounded-[32px] p-8 sm:p-9">
            <h2 className="text-2xl font-semibold text-white">Platform capabilities</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              <li>Protected routes with Supabase sessions</li>
              <li>Multi-tenant data access controlled with RLS</li>
              <li>Operational dashboards for devices, incidents, and compliance</li>
            </ul>
          </div>
          {!isSupabaseConfigured() ? <SetupNotice /> : null}
        </section>
      </div>
    </main>
  );
}
