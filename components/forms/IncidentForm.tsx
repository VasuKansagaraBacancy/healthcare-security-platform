"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createIncidentAction, type ActionResult } from "@/app/actions";

interface IncidentValues {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "mitigated" | "closed";
}

export function IncidentForm() {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<IncidentValues>({
    defaultValues: {
      severity: "high",
      status: "open",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await createIncidentAction(values);
          setResult(response);
          if (response.success) {
            reset();
            router.refresh();
          }
        });
      })}
      className="grid gap-5"
    >
      <input
        {...register("title", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
        placeholder="Suspicious lateral movement from clinical workstation"
      />
      <textarea
        {...register("description", { required: true })}
        rows={4}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
        placeholder="Describe impact, scope, affected systems, and immediate containment actions."
      />
      <select
        {...register("severity", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      {result ? (
        <p className={`text-sm leading-6 ${result.success ? "text-emerald-300" : "text-rose-300"}`}>
          {result.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Saving..." : "Report incident"}
      </button>
    </form>
  );
}
