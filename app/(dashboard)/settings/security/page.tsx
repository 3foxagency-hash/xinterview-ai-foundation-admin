'use client';

import * as React from 'react';
import { Check, Eye, EyeOff, Loader2, Lock, LogOut, Monitor, ShieldCheck, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { getPasswordChecks, getPasswordStrength, strengthConfig } from '@/lib/utils/password';
import { changePassword, getSessions, revokeSession, type ActiveSession } from '@/lib/api/profile';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

export default function SecurityPage() {
  return (
    <SettingsPage
      title="Password & security"
      scope="personal"
      description="Your password and the devices signed in to your account."
    >
      <PasswordCard />
      <SessionsCard />
    </SettingsPage>
  );
}

/* ─────────────────────────── Password ─────────────────────────── */

function PasswordCard() {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checks = getPasswordChecks(next);
  const strength = getPasswordStrength(next);
  const meter = strengthConfig[strength];
  const mismatch = confirm.length > 0 && next !== confirm;

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await changePassword(current, next, confirm);
      toast.success('Password updated');
      reset();
    } catch (err) {
      setError(getSettingsErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Lock size={16} className="text-primary" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-h3 text-heading">Change password</h2>
          <p className="mt-0.5 text-body-sm text-muted">
            Use a strong password you don&apos;t reuse anywhere else.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Current password" htmlFor="current-password">
            <PasswordInput
              id="current-password"
              value={current}
              onChange={(v) => {
                setCurrent(v);
                setError(null);
              }}
              show={show}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password" htmlFor="new-password">
            <PasswordInput
              id="new-password"
              value={next}
              onChange={(v) => {
                setNext(v);
                setError(null);
              }}
              show={show}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm-password">
            <PasswordInput
              id="confirm-password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setError(null);
              }}
              show={show}
              autoComplete="new-password"
              invalid={mismatch}
            />
            {mismatch && (
              <p className="mt-1.5 text-body-sm text-error">Passwords do not match.</p>
            )}
          </Field>
        </div>

        {/* Live strength, so the meter can't contradict the submit error. */}
        {next && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-1 gap-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < meter.segments ? meter.color : 'bg-border'
                    )}
                  />
                ))}
              </div>
              <span className="shrink-0 text-caption font-medium text-muted">{meter.label}</span>
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-caption',
                    c.passed ? 'text-success' : 'text-muted'
                  )}
                >
                  <Check size={12} className={cn(!c.passed && 'opacity-40')} aria-hidden />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="inline-flex w-fit items-center gap-1.5 rounded text-body-sm text-muted transition-colors hover:text-heading"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
          {show ? 'Hide passwords' : 'Show passwords'}
        </button>

        {error && (
          <p role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reset}
            disabled={!current && !next && !confirm}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading || !current || !next || !confirm || mismatch}
            aria-busy={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Update password
          </button>
        </div>
      </form>
    </section>
  );
}

/* ─────────────────────────── Sessions ─────────────────────────── */

function SessionsCard() {
  const [sessions, setSessions] = React.useState<ActiveSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSessions();
        if (!cancelled) setSessions(s);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRevoke = async (s: ActiveSession) => {
    setBusyId(s.id);
    try {
      await revokeSession(s.id);
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
      toast.success(`Signed out of ${s.device}`);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck size={16} className="text-primary" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-h3 text-heading">Where you&apos;re signed in</h2>
          <p className="mt-0.5 text-body-sm text-muted">
            Sign out any device you don&apos;t recognise.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-border" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-border" />
                  <div className="h-3 w-56 animate-pulse rounded bg-border" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted-bg">
                    {s.kind === 'mobile' ? (
                      <Smartphone size={15} className="text-muted" aria-hidden />
                    ) : (
                      <Monitor size={15} className="text-muted" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-body-sm font-medium text-heading">
                        {s.device}
                      </span>
                      {s.current && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-caption font-medium text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                          This device
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-caption text-muted">
                      {s.location} · {s.lastActive}
                    </p>
                  </div>
                </div>

                {!s.current && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(s)}
                    disabled={busyId === s.id}
                    aria-busy={busyId === s.id}
                    className="inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover disabled:opacity-50"
                  >
                    {busyId === s.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <LogOut size={13} />
                    )}
                    Sign out
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── Primitives ─────────────────────────── */

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1.5 block text-body-sm font-medium text-heading">
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  autoComplete,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  autoComplete: string;
  invalid?: boolean;
}) {
  return (
    <input
      id={id}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-lg border bg-background px-3 text-body text-heading transition-all hover:border-border-strong',
        invalid ? 'border-error' : 'border-border'
      )}
    />
  );
}
