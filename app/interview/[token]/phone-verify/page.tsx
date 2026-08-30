'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PhoneVerifyScreen } from '@/components/interview/phone-verify-screen';
import { DevPanel } from '@/components/interview/dev-panel';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

export default function PhoneVerifyPage() {
  const router = useRouter();
  const [config, setConfig] = React.useState<InterviewConfig>(defaultConfig);
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    setIsDev(new URLSearchParams(window.location.search).has('dev'));
  }, []);

  return (
    <>
      <PhoneVerifyScreen
        config={config}
        onVerified={() => router.push('./setup')}
        onUseDifferentNumber={() => router.push('../')}
      />
      {isDev && <DevPanel config={config} onChange={setConfig} />}
    </>
  );
}
