'use client';

import * as React from 'react';
import {
  Building2,
  CalendarDays,
  Camera,
  Loader2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { SaveBar } from '@/components/settings/save-bar';
import { PhoneInput } from '@/components/settings/phone-input';
import { WizardCombobox } from '@/components/wizard/wizard-combobox';
import { ProfileSkeleton } from '@/components/settings/profile-skeleton';
import { timezones } from '@/lib/constants/timezones';
import {
  getProfile,
  saveProfile,
  uploadAvatar,
  type UserProfile,
} from '@/lib/api/profile';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

const TZ_OPTIONS = timezones.map((t) => ({ value: t.key, label: t.label }));

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [initial, setInitial] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProfile();
        if (cancelled) return;
        setProfile(p);
        setInitial(p);
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

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
    setJustSaved(false);
  };

  const isDirty = React.useMemo(
    () => !!profile && !!initial && JSON.stringify(profile) !== JSON.stringify(initial),
    [profile, initial]
  );

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const saved = await saveProfile(profile);
      setProfile(saved);
      setInitial(saved);
      setJustSaved(true);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <ProfileSkeleton />;

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <>
      <SettingsPage
        title="Profile"
        scope="personal"
        description="Your details and password. Changes save when you're ready — nothing is applied until you hit save."
      >
        {/* Identity card — avatar, name and the facts you can't edit, in one band. */}
        <IdentityCard
          profile={profile}
          fullName={fullName}
          onAvatarChange={(url) => update('avatarUrl', url)}
        />

        {/* Two columns on wide screens: the form reads as one object, not a
            stack of unrelated rows. */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          <div className="min-w-0 space-y-6">
            <Card
              title="Personal details"
              description="Your name and photo are visible to teammates."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="first-name">
                  <TextInput
                    id="first-name"
                    value={profile.firstName}
                    onChange={(v) => update('firstName', v)}
                    placeholder="Sarah"
                  />
                </Field>
                <Field label="Last name" htmlFor="last-name">
                  <TextInput
                    id="last-name"
                    value={profile.lastName}
                    onChange={(v) => update('lastName', v)}
                    placeholder="Chen"
                  />
                </Field>
                <Field
                  label="Email"
                  htmlFor="email"
                  hint="Used to sign in and receive notifications."
                  className="sm:col-span-2"
                >
                  <TextInput
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(v) => update('email', v)}
                  />
                </Field>
                <Field label="Phone" className="sm:col-span-2">
                  <PhoneInput value={profile.phone} onChange={(v) => update('phone', v)} />
                </Field>
                <Field label="Job title" htmlFor="job-title">
                  <TextInput
                    id="job-title"
                    value={profile.jobTitle}
                    onChange={(v) => update('jobTitle', v)}
                    placeholder="Talent Acquisition Lead"
                  />
                </Field>
                <Field label="Location" htmlFor="location">
                  <TextInput
                    id="location"
                    value={profile.location}
                    onChange={(v) => update('location', v)}
                    placeholder="San Francisco, CA"
                  />
                </Field>
                <Field
                  label="Bio"
                  htmlFor="bio"
                  hint={`${profile.bio.length}/280`}
                  className="sm:col-span-2"
                >
                  <textarea
                    id="bio"
                    rows={3}
                    maxLength={280}
                    value={profile.bio}
                    onChange={(e) => update('bio', e.target.value)}
                    placeholder="A short introduction for your teammates."
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-body text-heading placeholder:text-muted transition-all hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                  />
                </Field>
              </div>
            </Card>
          </div>

          {/* Preferences sit apart — they change behaviour, not identity. */}
          <aside className="min-w-0 space-y-6">
            <Card title="Preferences" description="How XInterview behaves for you.">
              <WizardCombobox
                label="Timezone"
                options={TZ_OPTIONS}
                value={profile.timezone}
                onChange={(v) => update('timezone', v)}
                searchPlaceholder="Search timezones…"
              />
              <p className="mt-2 text-body-sm text-muted">
                Interview times and deadlines display in this zone.
              </p>
            </Card>

            <Card title="Workspace" description="Managed by your organisation.">
              <dl className="space-y-3">
                <MetaItem icon={Building2} label="Company" value={profile.organization} />
                <MetaItem icon={ShieldCheck} label="Role" value={profile.role} />
                <MetaItem icon={CalendarDays} label="Joined" value={profile.joinedOn} />
              </dl>
              <p className="mt-4 text-body-sm text-muted">
                Need a different role? Ask a workspace owner.
              </p>
            </Card>
          </aside>
        </div>
      </SettingsPage>

      <SaveBar
        visible={isDirty}
        loading={saving}
        saved={justSaved}
        onDiscard={() => {
          if (initial) setProfile(initial);
          setJustSaved(false);
        }}
        onSave={handleSave}
      />
    </>
  );
}

/* ─────────────────────────── Identity ─────────────────────────── */

function IdentityCard({
  profile,
  fullName,
  onAvatarChange,
}: {
  profile: UserProfile;
  fullName: string;
  onAvatarChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so re-picking the same file still fires onChange.
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { avatarUrl } = await uploadAvatar(file);
      onAvatarChange(avatarUrl);
      toast.success('Photo updated — save to apply');
    } catch (err) {
      toast.error(getSettingsErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      <div className="h-16 bg-hero-gradient sm:h-20" aria-hidden />

      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:gap-5">
        <div className="relative -mt-12 h-24 w-24 shrink-0 self-start sm:-mt-14">
          <div className="relative h-full w-full overflow-hidden rounded-2xl border-4 border-surface bg-primary/10 shadow-sm">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-h1 font-bold text-primary">
                {initials || '—'}
              </span>
            )}
            {busy && (
              <span className="absolute inset-0 flex items-center justify-center bg-heading/40">
                <Loader2 size={20} className="animate-spin text-white" />
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-heading shadow-sm transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <div className="min-w-0 flex-1 sm:pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-h2 text-heading">{fullName || 'Your name'}</h2>
            <StatusPill status={profile.status} />
          </div>
          <p className="mt-0.5 truncate text-body text-bodyText">{profile.jobTitle}</p>
          <p className="mt-0.5 truncate text-body-sm text-muted">{profile.email}</p>
        </div>

        {profile.avatarUrl && (
          <button
            type="button"
            onClick={() => {
              onAvatarChange(null);
              toast.success('Photo removed — save to apply');
            }}
            className="inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:mb-1"
          >
            <Trash2 size={14} />
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: UserProfile['status'] }) {
  const tone =
    status === 'Active'
      ? 'bg-success/10 text-success'
      : status === 'Invited'
        ? 'bg-warning/10 text-warning'
        : 'bg-error/10 text-error';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium',
        tone
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

/* ─────────────────────────── Primitives ─────────────────────────── */

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h3 text-heading">{title}</h2>
          {description && <p className="mt-1 text-body-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-body-sm font-medium text-heading">
          {label}
        </label>
        {hint && <span className="shrink-0 text-caption text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-body text-heading placeholder:text-muted transition-all hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
    />
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted-bg">
        <Icon size={14} className="text-muted" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-caption text-muted">{label}</dt>
        <dd className="truncate text-body-sm font-medium text-heading">{value}</dd>
      </div>
    </div>
  );
}
