"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { registerAction, type ActionResult } from "@/app/actions";
import type { InviteDetails } from "@/types/database";

interface RegisterValues {
  organizationName?: string;
  email: string;
  password: string;
  inviteToken?: string;
}

export function RegisterForm({
  invite,
  inviteToken,
}: {
  invite?: InviteDetails | null;
  inviteToken?: string | null;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<RegisterValues>({
    defaultValues: {
      organizationName: invite ? undefined : "",
      email: invite?.email ?? "",
      inviteToken: undefined,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await registerAction(values);
          setResult(response);
          if (response.success && response.redirectTo) {
            router.push(response.redirectTo);
            router.refresh();
          }
        });
      })}
      className="space-y-6"
    >
      {invite ? (
        <input {...register("inviteToken")} type="hidden" defaultValue={inviteToken ?? ""} />
      ) : null}
      {invite ? (
        <div className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-100">Invite</p>
          <p className="mt-2 text-sm text-white">Organization: {invite.organization_name}</p>
          <p className="mt-1 text-sm text-white">
            Assigned role: {invite.role === "analyst" ? "Security Analyst" : invite.role === "auditor" ? "Viewer / Staff" : "Admin"}
          </p>
        </div>
      ) : (
        <div>
          <label className="mb-2.5 block text-sm font-medium text-slate-200">Organization name</label>
          <input
            {...register("organizationName", { required: !invite })}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
            placeholder="Meditology Health"
          />
        </div>
      )}
      <div>
        <label className="mb-2.5 block text-sm font-medium text-slate-200">Email</label>
        <input
          {...register("email", { required: true })}
          type="email"
          readOnly={Boolean(invite)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
          placeholder="admin@hospital.org"
        />
      </div>
      <div>
        <label className="mb-2.5 block text-sm font-medium text-slate-200">Password</label>
        <input
          {...register("password", { required: true })}
          type="password"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
          placeholder="Minimum 8 characters"
        />
      </div>
      {result ? (
        <p className={`text-sm leading-6 ${result.success ? "text-emerald-300" : "text-rose-300"}`}>
          {result.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? (invite ? "Accepting invite..." : "Creating workspace...") : invite ? "Join organization" : "Create workspace"}
      </button>
      <p className="text-sm text-slate-400">
        Already onboarded?{" "}
        <Link href="/login" className="text-teal-300 hover:text-teal-200">
          Login here
        </Link>
      </p>
    </form>
  );
}
