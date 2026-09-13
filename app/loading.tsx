export default function Loading() {
  return (
    <main className="min-h-screen bg-[#050a12] p-6 text-slate-300">
      <div className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-20 rounded-xl bg-slate-900/70" />
        <div className="grid gap-5 lg:grid-cols-[1.5fr_.8fr]">
          <div className="h-[520px] rounded-xl bg-slate-900/70" />
          <div className="h-[520px] rounded-xl bg-slate-900/70" />
        </div>
      </div>
    </main>
  );
}
