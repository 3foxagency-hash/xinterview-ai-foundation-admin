import { redirect } from 'next/navigation';

// Next 15 passes `params` as a Promise, so it must be awaited.
export default async function CustomisationIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/jobs/${id}/edit/customisation/branding`);
}
