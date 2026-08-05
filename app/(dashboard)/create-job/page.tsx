import { redirect } from 'next/navigation';

/**
 * "Create New Job" in the sidebar points here; the wizard itself lives at
 * /jobs/new/setup. Redirecting keeps the nav entry meaningful instead of
 * showing a placeholder for a flow that is already built.
 */
export default function CreateJobPage() {
  redirect('/jobs/new/setup');
}
