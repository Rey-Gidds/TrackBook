export default function MeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-light)]"></div>
            <div className="h-4 w-32 bg-[var(--surface-light)] rounded"></div>
        </div>
    </div>
  );
}
