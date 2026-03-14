import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  const configured = isSupabaseConfigured();

  return (
    <main className="section-grid min-h-screen p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-panel flex flex-col justify-between rounded-[32px] p-8 sm:p-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-teal-300">
              Healthcare cybersecurity risk management platform
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Build a live operating picture for vulnerabilities, incidents, and HIPAA readiness.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              Centralize device inventory, monitor security score movement, triage active
              incidents, and package audit-ready reports for clinical environments.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["Security score", "Weighted view of device risk, open findings, and active incidents"],
              ["Compliance tracking", "Operational checklist for HIPAA-aligned controls and scoring"],
              ["Incident response", "Report, prioritize, and move cases from open to closed"],
            ].map(([title, description]) => (
              <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[32px] p-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-orange-300">
              Launch workspace
            </p>
            <div className="mt-6 space-y-4">
              <Link
                href="/login"
                className="block rounded-2xl bg-teal-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-teal-300/40 hover:bg-teal-300/10"
              >
                Register organization
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Included modules
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Dashboard KPIs with Recharts visualizations</li>
              <li>Device inventory and risk rating workflows</li>
              <li>Vulnerability and incident lifecycle management</li>
              <li>Compliance scoring and exportable reports</li>
            </ul>
          </div>

          {!configured ? (
            <div className="mt-6">
              <SetupNotice />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
