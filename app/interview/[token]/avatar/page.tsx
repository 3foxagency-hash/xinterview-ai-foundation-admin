'use client';

import { AvatarInterviewShell } from '@/components/interview/avatar-interview-shell';
import { interviewSession } from '@/config/interview-session';

export default function AvatarInterviewPage() {
  return <AvatarInterviewShell session={interviewSession} />;
}
