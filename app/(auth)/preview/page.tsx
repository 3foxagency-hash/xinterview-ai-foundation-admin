'use client';

import { AuthCard } from '@/components/auth';
import { AuthButton } from '@/components/auth';
import { AuthInput } from '@/components/auth';
import { AuthPasswordField } from '@/components/auth';
import { AuthOTPInput } from '@/components/auth';
import { ErrorBanner } from '@/components/auth';
import { AuthFooterLink } from '@/components/auth';
import { Mail, Lock, User } from 'lucide-react';
import * as React from 'react';

export default function AuthPreviewPage() {
  const [otp, setOtp] = React.useState('');
  const [pw, setPw] = React.useState('');

  return (
    <AuthCard
      heading="Preview Shell"
      description="This is a placeholder to validate the authentication layout and component primitives. No business logic is wired up."
      footer={
        <AuthFooterLink
          prompt="Already have an account?"
          linkText="Sign in"
          href="/auth-styleguide"
        />
      }
    >
      {/* Inputs preview */}
      <AuthInput
        label="Email"
        type="email"
        placeholder="you@company.com"
        leadingIcon={<Mail size={18} strokeWidth={1.5} />}
      />

      <AuthInput
        label="Name with error"
        placeholder="Jane Doe"
        error="This field is required"
        leadingIcon={<User size={18} strokeWidth={1.5} />}
      />

      <AuthInput
        label="Disabled field"
        placeholder="Cannot edit"
        disabled
        leadingIcon={<Lock size={18} strokeWidth={1.5} />}
      />

      {/* Password field with strength */}
      <AuthPasswordField
        label="Password"
        placeholder="Enter a strong password"
        showStrength
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        leadingIcon={<Lock size={18} strokeWidth={1.5} />}
      />

      {/* Error banner */}
      <ErrorBanner message="Invalid email or password. Please try again." />

      {/* OTP */}
      <div>
        <label className="mb-2 block text-caption font-medium text-heading">
          Verification code
        </label>
        <AuthOTPInput value={otp} onChange={setOtp} />
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <AuthButton variant="primary" size="md">Primary</AuthButton>
        <AuthButton variant="secondary" size="md">Secondary</AuthButton>
        <AuthButton variant="ghost" size="md">Ghost</AuthButton>
        <AuthButton variant="primary" size="md" loading>
          Loading
        </AuthButton>
        <AuthButton variant="primary" size="md" disabled>
          Disabled
        </AuthButton>
      </div>
    </AuthCard>
  );
}
