"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { loginAction, type ActionResult } from "@/app/actions";

interface LoginValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<LoginValues>();

  return (
    <form
      onSubmit={handleSubmit((values) => {
        startTransition(async () => {
          const response = await loginAction(values);
          setResult(response);
          if (response.success && response.redirectTo) {
            router.push(response.redirectTo);
            router.refresh();
          }
        });
      })}
      className="space-y-6"
    >
      <div>
        <label className="mb-2.5 block text-sm font-medium text-slate-200">Email</label>
        <input
          {...register("email", { required: true })}
          type="email"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition focus:border-teal-300/40"
          placeholder="security@hospital.org"
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
        {isPending ? "Signing in..." : "Login"}
      </button>
      <p className="text-sm text-slate-400">
        Need an account?{" "}
        <Link href="/register" className="text-teal-300 hover:text-teal-200">
          Register your organization
        </Link>
      </p>
    </form>
  );
}
