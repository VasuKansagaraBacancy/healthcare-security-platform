export function PageLoader() {
  return (
    <div className="section-grid min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 lg:flex-row">
        <aside className="glass-panel hidden min-h-[calc(100vh-3rem)] w-80 shrink-0 rounded-[32px] p-6 lg:block">
          <div className="animate-pulse space-y-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="h-3 w-28 rounded-full bg-teal-300/30" />
            <div className="h-8 w-48 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-white/8" />
              <div className="h-3 w-5/6 rounded-full bg-white/8" />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="h-[54px] animate-pulse rounded-2xl border border-white/8 bg-white/[0.04]"
              />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6 pb-6">
          <section className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="animate-pulse space-y-5">
              <div className="h-4 w-36 rounded-full bg-teal-300/30" />
              <div className="h-10 w-full max-w-xl rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-full max-w-3xl rounded-full bg-white/8" />
                <div className="h-3 w-4/5 max-w-2xl rounded-full bg-white/8" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 rounded-[24px] border border-white/8 bg-white/[0.04]"
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="glass-panel h-44 animate-pulse rounded-[30px] border border-white/8"
              />
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="glass-panel h-[25rem] animate-pulse rounded-[30px] border border-white/8"
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
