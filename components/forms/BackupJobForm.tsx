"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createBackupJobAction, type ActionResult } from "@/app/actions";

interface BackupValues {
  status: "success" | "warning" | "failed" | "running";
  last_backup_time: string;
  backup_size: number;
}

export function BackupJobForm() {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<BackupValues>({
    defaultValues: {
      status: "success",
      last_backup_time: new Date().toISOString().slice(0, 16),
      backup_size: 24.8,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await createBackupJobAction({
            ...values,
            last_backup_time: new Date(values.last_backup_time).toISOString(),
          });
          setResult(response);
          if (response.success) {
            reset();
            router.refresh();
          }
        });
      })}
      className="grid gap-5 md:grid-cols-2"
    >
      <select
        {...register("status", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="success">Success</option>
        <option value="warning">Warning</option>
        <option value="failed">Failed</option>
        <option value="running">Running</option>
      </select>
      <input
        {...register("backup_size", { required: true, valueAsNumber: true })}
        type="number"
        min={0}
        step="0.1"
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      />
      <input
        {...register("last_backup_time", { required: true })}
        type="datetime-local"
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40 md:col-span-2"
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
        {isPending ? "Saving..." : "Record backup job"}
      </button>
    </form>
  );
}
