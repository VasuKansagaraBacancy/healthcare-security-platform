import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { SetupNotice } from "@/components/SetupNotice";
import { getCurrentUser } from "@/lib/auth";
import { getPendingInviteDetails } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

interface RegisterPageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;

  if (currentUser) {
    redirect("/dashboard");
  }

  const inviteToken = params.invite ?? null;
  const invite = inviteToken ? await getPendingInviteDetails(inviteToken) : null;
  const isInviteFlow = Boolean(inviteToken);

  return (
    <main className="section-grid min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center">
        <section className="glass-panel rounded-[32px] p-8 sm:p-10 lg:p-12">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-orange-300">
            {isInviteFlow ? "Join organization" : "Create workspace"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            {isInviteFlow ? "Accept invite" : "Register"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            {isInviteFlow
              ? "Use your invitation to join an existing healthcare organization with the assigned role."
              : "Provision a healthcare organization, create the first admin user, and start tracking cyber risk in one workflow."}
          </p>
          <div className="mt-8">
            <RegisterForm invite={invite} inviteToken={inviteToken} />
            {inviteToken && !invite ? (
              <p className="mt-4 text-sm text-rose-300">
                This invite is invalid, expired, or already used.
              </p>
            ) : null}
          </div>
        </section>
      </div>
      {!isSupabaseConfigured() ? (
        <div className="mx-auto mt-6 w-full max-w-2xl">
          <SetupNotice />
        </div>
      ) : null}
    </main>
  );
}
