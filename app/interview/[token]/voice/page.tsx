'use client';

import * as React from 'react';
import { VoiceInterviewShell } from '@/components/interview/voice-interview-shell';
import { interviewSession } from '@/config/interview-session';

export default function VoiceInterviewPage() {
  return <VoiceInterviewShell token="demo" session={interviewSession} />;
}
