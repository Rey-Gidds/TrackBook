export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.2em]">Loading</p>
      </div>
    </div>
  );
}
