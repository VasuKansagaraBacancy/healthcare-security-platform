"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createDeviceAction, type ActionResult } from "@/app/actions";

interface DeviceValues {
  name: string;
  type: "medical_device" | "server" | "workstation" | "network" | "cloud_service" | "application";
  risk_level: "low" | "medium" | "high" | "critical";
}

export function DeviceForm() {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<DeviceValues>({
    defaultValues: {
      type: "medical_device",
      risk_level: "medium",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await createDeviceAction(values);
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
        placeholder="Radiology Workstation 03"
      />
      <select
        {...register("type", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="medical_device">Medical device</option>
        <option value="server">Server</option>
        <option value="workstation">Workstation</option>
        <option value="network">Network</option>
        <option value="cloud_service">Cloud service</option>
        <option value="application">Application</option>
      </select>
      <select
        {...register("risk_level", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="low">Low risk</option>
        <option value="medium">Medium risk</option>
        <option value="high">High risk</option>
        <option value="critical">Critical risk</option>
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
        {isPending ? "Saving..." : "Add device"}
      </button>
    </form>
  );
}
