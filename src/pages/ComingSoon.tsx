export function ComingSoon({ emoji, title, phase, children }: { emoji: string; title: string; phase: number; children: string }) {
  return (
    <div className="card animate-fade-up mx-auto mt-6 max-w-md p-8 text-center">
      <p className="text-6xl" aria-hidden>
        {emoji}
      </p>
      <h1 className="font-display mt-4 text-3xl text-ink">{title}</h1>
      <p className="mt-2 text-muted">{children}</p>
      <p className="mt-5 inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted">
        Coming in Phase {phase}
      </p>
    </div>
  );
}
