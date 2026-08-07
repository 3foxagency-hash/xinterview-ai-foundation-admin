import { redirect } from 'next/navigation';

export default function CustomisationIndexPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/jobs/${params.id}/edit/customisation/branding`);
}
