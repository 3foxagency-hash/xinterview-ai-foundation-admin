import { InterviewPage } from '@/components/interview/interview-page';

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  // The token is not used — everything renders from the mock config.
  // It exists in the URL to make the route feel real for the candidate.
  void params;

  return <InterviewPage />;
}
