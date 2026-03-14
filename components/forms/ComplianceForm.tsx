"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createComplianceCheckAction, type ActionResult } from "@/app/actions";

interface ComplianceValues {
  name: string;
  status: "compliant" | "in_progress" | "at_risk" | "non_compliant";
  score: number;
}

export function ComplianceForm() {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<ComplianceValues>({
    defaultValues: {
      status: "in_progress",
      score: 75,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await createComplianceCheckAction(values);
          setResult(response);
          if (response.success) {
            reset();
            router.refresh();
          }
        });
      })}
      className="grid gap-5 md:grid-cols-2"
    >
      <input
        {...register("name", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40 md:col-span-2"
        placeholder="HIPAA 164.312(a)(2)(i) Unique User Identification"
      />
      <select
        {...register("status", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="compliant">Compliant</option>
        <option value="in_progress">In progress</option>
        <option value="at_risk">At risk</option>
        <option value="non_compliant">Non-compliant</option>
      </select>
      <input
        {...register("score", { required: true, valueAsNumber: true })}
        type="number"
        min={0}
        max={100}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      />
      {result ? (
        <p className={`md:col-span-2 text-sm leading-6 ${result.success ? "text-emerald-300" : "text-rose-300"}`}>
          {result.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
      >
        {isPending ? "Saving..." : "Add compliance check"}
      </button>
    </form>
  );
}
