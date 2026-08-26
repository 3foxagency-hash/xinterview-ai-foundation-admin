import { InterviewPage } from '@/components/interview/interview-page';

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <InterviewPage token={token} />;
}
