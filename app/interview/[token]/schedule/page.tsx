'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ScheduleScreen } from '@/components/interview/schedule-screen';
import { DevPanel } from '@/components/interview/dev-panel';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

export default function SchedulePage() {
  const router = useRouter();
  const [config, setConfig] = React.useState<InterviewConfig>(defaultConfig);
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    setIsDev(new URLSearchParams(window.location.search).has('dev'));
  }, []);

  return (
    <>
      <ScheduleScreen
        config={config}
        onConfirmed={(choice) => {
          if (choice.mode === 'now') {
            toast("We're connecting your call now.");
          } else {
            toast('Call scheduled — see you then.');
          }
          router.push('./complete');
        }}
      />
      {isDev && <DevPanel config={config} onChange={setConfig} />}
    </>
  );
}
