'use client';

import * as React from 'react';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/providers/theme-toggle';
import {
  AuthButton,
  AuthInput,
  AuthPasswordField,
  AuthOTPInput,
  AuthCard,
  ErrorBanner,
  AuthFooterLink,
} from '@/components/auth';
import { cn } from '@/lib/utils';

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-h2 text-heading">{title}</h2>
      {desc && <p className="mt-1 text-body-sm text-muted">{desc}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption font-medium text-muted">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-6', className)}>
      {children}
    </div>
  );
}

export default function AuthStyleguidePage() {
  const [otp, setOtp] = React.useState('');
  const [otpError, setOtpError] = React.useState(false);
  const [pw, setPw] = React.useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-h3 text-heading">XInterview</span>
            <span className="text-caption text-muted">Auth Component Gallery</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/preview"
              className="text-caption text-primary underline-offset-4 hover:underline"
            >
              View shell
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <p className="text-caption uppercase tracking-wider text-primary">Authentication</p>
          <h1 className="mt-2 text-display text-heading">Component Gallery</h1>
          <p className="mt-3 max-w-2xl text-body-lg text-bodyText">
            Every authentication primitive in every state. Toggle the theme to
            verify both light and dark appearances.
          </p>
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 rounded-md border border-accent-ai/30 bg-accent-ai/10 px-3 py-1.5 text-caption font-medium text-accent-ai">
              <Sparkles size={16} strokeWidth={1.5} />
              AI Interview Platform
            </span>
          </div>
        </div>

        {/* Buttons */}
        <section className="mb-12">
          <SectionTitle title="Button" desc="Three variants × three sizes. Loading state shows a spinner and disables interaction." />
          <Card className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Row label="Primary">
                <div className="flex flex-wrap gap-2">
                  <AuthButton variant="primary" size="sm">Small</AuthButton>
                  <AuthButton variant="primary" size="md">Medium</AuthButton>
                  <AuthButton variant="primary" size="lg">Large</AuthButton>
                </div>
              </Row>
              <Row label="Secondary">
                <div className="flex flex-wrap gap-2">
                  <AuthButton variant="secondary" size="sm">Small</AuthButton>
                  <AuthButton variant="secondary" size="md">Medium</AuthButton>
                  <AuthButton variant="secondary" size="lg">Large</AuthButton>
                </div>
              </Row>
              <Row label="Ghost">
                <div className="flex flex-wrap gap-2">
                  <AuthButton variant="ghost" size="sm">Small</AuthButton>
                  <AuthButton variant="ghost" size="md">Medium</AuthButton>
                  <AuthButton variant="ghost" size="lg">Large</AuthButton>
                </div>
              </Row>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Row label="Loading">
                <AuthButton variant="primary" loading>Loading</AuthButton>
              </Row>
              <Row label="Disabled">
                <AuthButton variant="primary" disabled>Disabled</AuthButton>
              </Row>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section className="mb-12">
          <SectionTitle title="Input" desc="Label, description, leading icon, error, and disabled states." />
          <Card className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Row label="Default">
                <AuthInput label="Email" type="email" placeholder="you@company.com" leadingIcon={<Mail size={18} strokeWidth={1.5} />} />
              </Row>
              <Row label="With description">
                <AuthInput label="Full name" placeholder="Jane Doe" description="As it appears on your resume." leadingIcon={<User size={18} strokeWidth={1.5} />} />
              </Row>
              <Row label="Error state">
                <AuthInput label="Email" type="email" placeholder="you@company.com" error="Enter a valid email address" leadingIcon={<Mail size={18} strokeWidth={1.5} />} />
              </Row>
              <Row label="Disabled">
                <AuthInput label="Company" placeholder="Acme Inc." disabled leadingIcon={<Lock size={18} strokeWidth={1.5} />} />
              </Row>
            </div>
          </Card>
        </section>

        {/* Password field */}
        <section className="mb-12">
          <SectionTitle title="Password Field" desc="Show/hide toggle, live requirements checklist, and 4-segment strength meter." />
          <Card className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Row label="With strength meter">
                <AuthPasswordField
                  label="Password"
                  placeholder="Type to see strength"
                  showStrength
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  leadingIcon={<Lock size={18} strokeWidth={1.5} />}
                />
              </Row>
              <Row label="Error state">
                <AuthPasswordField
                  label="Password"
                  placeholder="Enter password"
                  error="Password must contain a special character"
                  leadingIcon={<Lock size={18} strokeWidth={1.5} />}
                />
              </Row>
            </div>
          </Card>
        </section>

        {/* OTP */}
        <section className="mb-12">
          <SectionTitle title="OTP Input" desc="6-digit numeric input with auto-advance, paste support, and shake-on-error." />
          <Card className="space-y-6">
            <Row label="Default">
              <AuthOTPInput value={otp} onChange={setOtp} />
            </Row>
            <Row label="Error state (shake)">
              <AuthOTPInput value="123" onChange={() => {}} error />
            </Row>
          </Card>
        </section>

        {/* Error banner */}
        <section className="mb-12">
          <SectionTitle title="Error Banner" desc="Full-width alert with left border and error icon." />
          <Card>
            <ErrorBanner message="Invalid email or password. Please try again or reset your password." />
          </Card>
        </section>

        {/* AuthCard */}
        <section className="mb-12">
          <SectionTitle title="Auth Card" desc="The container primitive for every auth screen — heading, description, body, footer." />
          <Card>
            <AuthCard
              heading="Welcome back"
              description="Sign in to your XInterview account to continue."
              footer={
                <AuthFooterLink
                  prompt="Don't have an account?"
                  linkText="Sign up"
                  href="#"
                />
              }
            >
              <AuthInput label="Email" type="email" placeholder="you@company.com" leadingIcon={<Mail size={18} strokeWidth={1.5} />} />
              <AuthPasswordField label="Password" placeholder="Enter password" leadingIcon={<Lock size={18} strokeWidth={1.5} />} />
              <AuthButton variant="primary" size="lg" className="w-full">Sign in</AuthButton>
            </AuthCard>
          </Card>
        </section>

        {/* Footer link */}
        <section className="mb-12">
          <SectionTitle title="Footer Link" desc="Ghost/link styling for secondary navigation between auth screens." />
          <Card>
            <div className="space-y-3">
              <AuthFooterLink prompt="Already have an account?" linkText="Sign in" href="#" />
              <AuthFooterLink prompt="Don't have an account?" linkText="Sign up" href="#" />
              <AuthFooterLink prompt="Forgot your password?" linkText="Reset it" href="#" />
            </div>
          </Card>
        </section>

        <footer className="border-t border-border pt-6">
          <p className="text-caption text-muted">
            XInterview · Authentication Component Gallery · Indigo is the primary accent. Coral is reserved for AI features only.
          </p>
        </footer>
      </main>
    </div>
  );
}
