import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { SetupNotice } from "@/components/SetupNotice";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default async function RegisterPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <main className="section-grid min-h-screen p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-[32px] p-8 sm:p-10 lg:p-12">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-orange-300">
            Create workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Register</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Provision a healthcare organization, create the first user, and start tracking cyber
            risk in one workflow.
          </p>
          <div className="mt-8">
            <RegisterForm />
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass-panel rounded-[32px] p-8 sm:p-9">
            <h2 className="text-2xl font-semibold text-white">Registration behavior</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              <li>Creates a Supabase Auth account</li>
              <li>Attaches organization metadata for database provisioning</li>
              <li>Supports email confirmation or instant sessions</li>
            </ul>
          </div>
          {!isSupabaseConfigured() ? <SetupNotice /> : null}
        </section>
      </div>
    </main>
  );
}
