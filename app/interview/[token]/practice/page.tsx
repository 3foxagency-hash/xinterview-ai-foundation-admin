'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PracticeScreen } from '@/components/interview/practice-screen';
import { interviewSession } from '@/config/interview-session';

export default function PracticePage() {
  const router = useRouter();

  return (
    <PracticeScreen
      session={interviewSession}
      onComplete={() => router.push('./questions')}
      onBack={() => router.push('./setup')}
    />
  );
}
