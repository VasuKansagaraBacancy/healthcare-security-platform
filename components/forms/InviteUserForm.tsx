"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createInviteAction, type ActionResult } from "@/app/actions";

interface InviteUserValues {
  email: string;
  role: "analyst" | "auditor" | "admin";
}

export function InviteUserForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<InviteUserValues>({
    defaultValues: {
      role: "analyst",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await createInviteAction(values);
          setResult(response);
          if (response.success) {
            reset({ email: "", role: "analyst" });
          }
        });
      })}
      className="space-y-6"
    >
      <div>
        <label className="mb-2.5 block text-sm font-medium text-slate-200">User email</label>
        <input
          {...register("email", { required: true })}
          type="email"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
          placeholder="analyst@hospital.org"
        />
      </div>
      <div>
        <label className="mb-2.5 block text-sm font-medium text-slate-200">Assigned role</label>
        <select
          {...register("role", { required: true })}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
        >
          <option value="analyst">Security Analyst</option>
          <option value="auditor">Viewer / Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {result ? (
        <div className="space-y-3">
          <p className={`text-sm leading-6 ${result.success ? "text-emerald-300" : "text-rose-300"}`}>
            {result.message}
          </p>
          {result.inviteLink ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">
                Invite link
              </p>
              <p className="mt-2 break-all text-sm text-white">{result.inviteLink}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Creating invite..." : "Create invite link"}
      </button>
    </form>
  );
}
