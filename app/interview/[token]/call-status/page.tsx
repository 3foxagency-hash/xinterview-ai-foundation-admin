'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CallStatusScreen, type CallStatus } from '@/components/interview/call-status-screen';
import { DevPanel } from '@/components/interview/dev-panel';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

const STATUSES: CallStatus[] = ['booked', 'calling', 'not-received'];

function CallStatusPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = React.useState<InterviewConfig>(defaultConfig);
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    setIsDev(new URLSearchParams(window.location.search).has('dev'));
  }, []);

  const modeParam = searchParams.get('mode');
  const initialStatus: CallStatus = modeParam === 'now' ? 'calling' : 'booked';

  const dateParam = searchParams.get('date');
  const hourParam = searchParams.get('hour');
  const minuteParam = searchParams.get('minute');
  const tzParam = searchParams.get('tz');

  return (
    <>
      <CallStatusScreen
        config={config}
        initialStatus={initialStatus}
        scheduledDate={dateParam ? new Date(dateParam) : undefined}
        scheduledHour={hourParam ? Number(hourParam) : undefined}
        scheduledMinute={minuteParam ? Number(minuteParam) : undefined}
        timezone={tzParam ?? undefined}
        onAddToCalendar={() => toast('Calendar file downloaded.')}
        onScheduleInstead={() => router.push('./schedule')}
        onUseDifferentNumber={() => router.push('./phone-verify')}
      />
      {isDev && (
        <DevPanel config={config} onChange={setConfig} />
      )}
    </>
  );
}

export default function CallStatusPage() {
  return (
    <React.Suspense fallback={null}>
      <CallStatusPageInner />
    </React.Suspense>
  );
}
