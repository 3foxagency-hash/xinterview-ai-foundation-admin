import { Wordmark } from '@/components/wordmark';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
        <Wordmark />
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-h1 text-heading">Dashboard</h1>
          <p className="mt-2 text-body text-bodyText">
            Welcome to your XInterview admin dashboard. More coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
