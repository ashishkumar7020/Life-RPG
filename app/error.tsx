"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050a12] p-6 text-center">
      <div className="rpg-panel max-w-md p-8">
        <p className="mb-2 text-xs uppercase tracking-[.3em] text-cyan-300">System Error</p>
        <h1 className="mb-3 text-2xl text-slate-100">The realm needs another attempt.</h1>
        <p className="mb-6 text-sm text-slate-400">The interface hit an unexpected state. Your saved progression is not changed by this screen.</p>
        <button onClick={reset} className="rounded border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-400/20">
          Retry
        </button>
      </div>
    </main>
  );
}
