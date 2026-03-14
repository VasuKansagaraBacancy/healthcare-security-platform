"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createVendorAction, type ActionResult } from "@/app/actions";

interface VendorValues {
  name: string;
  risk_level: "low" | "medium" | "high" | "critical";
  compliance_status: "compliant" | "in_progress" | "at_risk" | "non_compliant";
  contact_email: string;
}

export function VendorForm() {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<VendorValues>({
    defaultValues: {
      risk_level: "medium",
      compliance_status: "in_progress",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await createVendorAction(values);
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
        placeholder="Radiology Imaging Partner"
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40 md:col-span-2"
      />
      <input
        {...register("contact_email", { required: true })}
        type="email"
        placeholder="security@vendor.com"
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40 md:col-span-2"
      />
      <select
        {...register("risk_level", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="low">Low risk</option>
        <option value="medium">Medium risk</option>
        <option value="high">High risk</option>
        <option value="critical">Critical risk</option>
      </select>
      <select
        {...register("compliance_status", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="compliant">Compliant</option>
        <option value="in_progress">In progress</option>
        <option value="at_risk">At risk</option>
        <option value="non_compliant">Non-compliant</option>
      </select>
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
        {isPending ? "Saving..." : "Add vendor"}
      </button>
    </form>
  );
}
