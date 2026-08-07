'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { VerifyForm } from '@/components/auth/verify-form';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-32" />}>
      <VerifyForm mode="signup" />
    </Suspense>
  );
}
