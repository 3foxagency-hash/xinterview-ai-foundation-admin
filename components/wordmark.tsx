export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
        <span className="text-button font-bold text-primary-foreground">X</span>
      </div>
      <span className="text-h3 font-semibold text-heading">XInterview</span>
    </div>
  );
}
