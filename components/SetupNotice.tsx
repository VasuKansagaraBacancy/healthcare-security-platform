export function SetupNotice() {
  return (
    <section className="glass-panel rounded-3xl p-6 text-sm text-slate-300">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-300">
        Environment required
      </p>
      <h2 className="mt-3 text-xl font-semibold text-white">
        Connect Supabase before using authenticated workflows.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
        Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, run the SQL in{" "}
        <code>supabase/schema.sql</code>, and restart the app. The interface is already wired for
        Supabase Auth, RLS, and REST endpoints.
      </p>
    </section>
  );
}
