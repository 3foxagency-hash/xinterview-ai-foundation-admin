'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CancelScreen } from '@/components/interview/cancel-screen';
import { DevPanel } from '@/components/interview/dev-panel';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

function CancelPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = React.useState<InterviewConfig>(defaultConfig);
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    setIsDev(new URLSearchParams(window.location.search).has('dev'));
  }, []);

  const dateParam = searchParams.get('date');
  const hourParam = searchParams.get('hour');
  const minuteParam = searchParams.get('minute');
  const tzParam = searchParams.get('tz');

  const backToCallStatus = () => {
    const params = new URLSearchParams({ mode: 'later' });
    if (dateParam) params.set('date', dateParam);
    if (hourParam) params.set('hour', hourParam);
    if (minuteParam) params.set('minute', minuteParam);
    if (tzParam) params.set('tz', tzParam);
    router.push(`./call-status?${params.toString()}`);
  };

  return (
    <>
      <CancelScreen
        config={config}
        bookingDate={dateParam ? new Date(dateParam) : undefined}
        bookingHour={hourParam ? Number(hourParam) : undefined}
        bookingMinute={minuteParam ? Number(minuteParam) : undefined}
        bookingTimezone={tzParam ?? undefined}
        onKeepInterview={backToCallStatus}
        onRescheduleInstead={() => {
          const params = new URLSearchParams();
          if (dateParam) params.set('date', dateParam);
          if (hourParam) params.set('hour', hourParam);
          if (minuteParam) params.set('minute', minuteParam);
          if (tzParam) params.set('tz', tzParam);
          router.push(`./reschedule?${params.toString()}`);
        }}
        onContactHiringTeam={() => toast('Opening a message to the hiring team.')}
      />
      {isDev && <DevPanel config={config} onChange={setConfig} />}
    </>
  );
}

export default function CancelPage() {
  return (
    <React.Suspense fallback={null}>
      <CancelPageInner />
    </React.Suspense>
  );
}
