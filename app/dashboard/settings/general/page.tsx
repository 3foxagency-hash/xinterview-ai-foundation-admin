'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SettingsPage,
  SettingsSection,
  SettingsRow,
  SaveBar,
  DangerZoneCard,
} from '@/components/settings';
import { SettingsInput } from '@/components/settings/settings-input';
import { SettingsSelect } from '@/components/settings/settings-select';
import { SegmentedControl } from '@/components/settings/segmented-control';
import { LogoUpload } from '@/components/settings/logo-upload';
import { DeleteCompanyDialog } from '@/components/settings/delete-company-dialog';
import { RadioCardGroup } from '@/components/auth/radio-card-group';
import {
  getOrganization,
  updateOrganization,
  getCurrentUser,
  type Organization,
  type CurrentUser,
} from '@/lib/api/settings';
import { organizationSchema } from '@/lib/validation/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';
import { COMPANY_TYPES } from '@/lib/constants/company-types';
import { features } from '@/lib/constants/features';
import { track } from '@/lib/utils/analytics';

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10' },
  { value: '10-50', label: '10-50' },
  { value: '50-500', label: '50-500' },
  { value: '500+', label: '500+' },
];

const COMPANY_TYPE_OPTIONS = [
  { value: 'Corporate', label: 'Corporate' },
  { value: 'Agency', label: 'Agency' },
];

const CATEGORY_OPTIONS = COMPANY_TYPES.map((t) => ({ value: t, label: t }));

type FormState = {
  companyName: string;
  companyWebsite: string;
  companySize: string;
  phoneNumber: string;
  companyType: 'Corporate' | 'Agency';
  businessCategory: string;
};

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [org, setOrg] = React.useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const [form, setForm] = React.useState<FormState>({
    companyName: '',
    companyWebsite: '',
    companySize: '',
    phoneNumber: '',
    companyType: 'Corporate',
    businessCategory: '',
  });
  const [initialForm, setInitialForm] = React.useState<FormState | null>(null);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [o, u] = await Promise.all([getOrganization(), getCurrentUser()]);
        if (!active) return;
        setOrg(o);
        setCurrentUser(u);
        setLogoUrl(o.logoUrl);
        const fs: FormState = {
          companyName: o.name,
          companyWebsite: o.website,
          companySize: o.size,
          phoneNumber: o.phone,
          companyType: o.companyType,
          businessCategory: o.businessCategory,
        };
        setForm(fs);
        setInitialForm(fs);
      } catch (e) {
        toast.error(getSettingsErrorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const isDirty = React.useMemo(() => {
    if (!initialForm) return false;
    return (Object.keys(form) as (keyof FormState)[]).some(
      (k) => form[k] !== initialForm[k]
    );
  }, [form, initialForm]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSave = async () => {
    const result = organizationSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormState;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaveLoading(true);
    try {
      const updated = await updateOrganization({
        name: form.companyName,
        website: form.companyWebsite,
        size: form.companySize,
        phone: form.phoneNumber,
        companyType: form.companyType,
        businessCategory: form.businessCategory,
        logoUrl,
      });
      setOrg(updated);
      setInitialForm({ ...form });
      toast.success('Company details updated');
      track('company_details_updated', { companyId: updated.id });
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDiscard = () => {
    if (initialForm) {
      setForm({ ...initialForm });
      setErrors({});
    }
  };

  const handleLogoReset = () => {
    setLogoUrl(null);
    setOrg((o) => (o ? { ...o, logoUrl: null } : o));
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setDeleteLoading(false);
    toast.success('Company account deletion requested');
  };

  React.useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (loading || !org) {
    return (
      <div className="mx-auto w-full max-w-[800px] px-8 py-8">
        <div className="h-7 w-40 animate-pulse rounded-md bg-border" />
        <div className="mt-4 h-4 w-60 animate-pulse rounded bg-border" />
      </div>
    );
  }

  const isOwner = currentUser?.isOwner ?? false;

  return (
    <>
      <SettingsPage
        title="General"
        scope="company"
        companyName={org.name}
        description="Your company's account details. These appear on candidate-facing interviews and reports."
      >
        <SettingsSection title="Company logo">
          <div className="px-4 py-4">
            <LogoUpload
              logoUrl={logoUrl}
              companyName={form.companyName}
              onUploaded={setLogoUrl}
              onReset={handleLogoReset}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Company details">
          <SettingsRow
            label="Company name"
            helper="The name candidates see on interview invites."
            control={
              <SettingsInput
                value={form.companyName}
                onChange={(e) => update('companyName', e.target.value)}
                error={errors.companyName}
                placeholder="Company name"
              />
            }
          />
          <SettingsRow
            label="Company website"
            helper="Optional. Include https://"
            control={
              <SettingsInput
                value={form.companyWebsite}
                onChange={(e) => update('companyWebsite', e.target.value)}
                error={errors.companyWebsite}
                placeholder="https://company.com"
              />
            }
          />
          <SettingsRow
            label="Company size"
            control={
              <RadioCardGroup
                options={COMPANY_SIZE_OPTIONS}
                value={form.companySize}
                onChange={(v) => update('companySize', v)}
                error={errors.companySize}
              />
            }
          />
          <SettingsRow
            label="Phone number"
            control={
              <SettingsInput
                value={form.phoneNumber}
                onChange={(e) => update('phoneNumber', e.target.value)}
                error={errors.phoneNumber}
                placeholder="+1 555 0100"
                leadingAddon="Tel"
              />
            }
          />
          <SettingsRow
            label="Company type"
            control={
              <SegmentedControl
                options={COMPANY_TYPE_OPTIONS}
                value={form.companyType}
                onChange={(v) => update('companyType', v as 'Corporate' | 'Agency')}
              />
            }
          />
          <SettingsRow
            label="Business category"
            helper="Legal entity type."
            control={
              <SettingsSelect
                options={CATEGORY_OPTIONS}
                value={form.businessCategory}
                onChange={(v) => update('businessCategory', v)}
                placeholder="Select a category"
                error={errors.businessCategory}
              />
            }
          />
        </SettingsSection>

        {features.companyDeletion && isOwner && (
          <SettingsSection title="Danger zone" danger>
            <DangerZoneCard
              title="Delete company account"
              description="This will permanently delete all jobs, candidates, interview recordings, reports, and all team access. This cannot be undone."
              actionLabel="Delete company"
              onAction={() => setDeleteOpen(true)}
              actionLoading={deleteLoading}
            />
          </SettingsSection>
        )}
      </SettingsPage>

      <SaveBar
        visible={isDirty}
        loading={saveLoading}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />

      {features.companyDeletion && isOwner && (
        <DeleteCompanyDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          companyName={org.name}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}
