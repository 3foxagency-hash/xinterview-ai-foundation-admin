'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RescheduleScreen } from '@/components/interview/reschedule-screen';
import { DevPanel } from '@/components/interview/dev-panel';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

function ReschedulePageInner() {
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

  return (
    <>
      <RescheduleScreen
        config={config}
        currentBookingDate={dateParam ? new Date(dateParam) : undefined}
        currentBookingHour={hourParam ? Number(hourParam) : undefined}
        currentBookingMinute={minuteParam ? Number(minuteParam) : undefined}
        currentBookingTimezone={tzParam ?? undefined}
        onConfirmed={(choice) => {
          const params = new URLSearchParams({
            mode: 'later',
            date: choice.date.toISOString(),
            hour: String(choice.hour),
            minute: String(choice.minute),
            tz: choice.timezone,
          });
          router.push(`./call-status?${params.toString()}`);
        }}
        onKeepOriginal={() => {
          const params = new URLSearchParams({ mode: 'later' });
          if (dateParam) params.set('date', dateParam);
          if (hourParam) params.set('hour', hourParam);
          if (minuteParam) params.set('minute', minuteParam);
          if (tzParam) params.set('tz', tzParam);
          router.push(`./call-status?${params.toString()}`);
        }}
        onCancelInterview={() => {
          const params = new URLSearchParams();
          if (dateParam) params.set('date', dateParam);
          if (hourParam) params.set('hour', hourParam);
          if (minuteParam) params.set('minute', minuteParam);
          if (tzParam) params.set('tz', tzParam);
          router.push(`./cancel?${params.toString()}`);
        }}
      />
      {isDev && <DevPanel config={config} onChange={setConfig} />}
    </>
  );
}

export default function ReschedulePage() {
  return (
    <React.Suspense fallback={null}>
      <ReschedulePageInner />
    </React.Suspense>
  );
}
