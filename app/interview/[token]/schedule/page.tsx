'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
          const params = new URLSearchParams({ mode: choice.mode });
          if (choice.mode === 'later') {
            if (choice.date) params.set('date', choice.date.toISOString());
            if (choice.hour !== undefined) params.set('hour', String(choice.hour));
            if (choice.minute !== undefined) params.set('minute', String(choice.minute));
            if (choice.timezone) params.set('tz', choice.timezone);
          }
          router.push(`./call-status?${params.toString()}`);
        }}
      />
      {isDev && <DevPanel config={config} onChange={setConfig} />}
    </>
  );
}
