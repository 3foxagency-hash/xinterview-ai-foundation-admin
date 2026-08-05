export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-h1 text-heading">{title}</h1>
    </div>
  );
}
