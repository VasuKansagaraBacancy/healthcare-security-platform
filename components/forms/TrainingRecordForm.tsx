"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createTrainingRecordAction, type ActionResult } from "@/app/actions";

interface TrainingRecordFormProps {
  users: Array<{ id: string; email: string }>;
}

interface TrainingValues {
  user_id: string;
  training_name: string;
  completion_status: "assigned" | "in_progress" | "completed" | "overdue";
  completion_date: string | null;
}

export function TrainingRecordForm({ users }: TrainingRecordFormProps) {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<TrainingValues>({
    defaultValues: {
      user_id: users[0]?.id,
      completion_status: "assigned",
      completion_date: null,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await createTrainingRecordAction({
            ...values,
            completion_date: values.completion_date || null,
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
        {...register("user_id", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40 md:col-span-2"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.email}
          </option>
        ))}
      </select>
      <input
        {...register("training_name", { required: true })}
        placeholder="Quarterly Phishing Resistance Training"
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40 md:col-span-2"
      />
      <select
        {...register("completion_status", { required: true })}
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      >
        <option value="assigned">Assigned</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
      </select>
      <input
        {...register("completion_date")}
        type="date"
        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
      />
      {result ? (
        <p className={`md:col-span-2 text-sm leading-6 ${result.success ? "text-emerald-300" : "text-rose-300"}`}>
          {result.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending || users.length === 0}
        className="rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
      >
        {isPending ? "Saving..." : "Assign training"}
      </button>
    </form>
  );
}
