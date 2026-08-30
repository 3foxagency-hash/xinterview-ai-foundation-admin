'use client';

import { useRouter } from 'next/navigation';
import { LiveInterviewScreen } from '@/components/interview/live-interview-screen';
import { interviewSession } from '@/config/interview-session';
import { interviewConfig } from '@/config/interview.mock';

export default function VoicePage() {
  const router = useRouter();

  return (
    <LiveInterviewScreen
      session={interviewSession}
      mode="voice"
      jobTitle={interviewConfig.job.title}
      onEnd={() => router.push('./complete')}
    />
  );
}
