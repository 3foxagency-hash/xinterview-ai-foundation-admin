'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { usePreviewSync } from '@/components/wizard/use-preview-sync';
import { getFormSettings, saveFormSettings } from '@/lib/api/jobs';
import type { FormSettingsInput, FieldRequirement } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';

const FIELDS: {
  key: keyof FormSettingsInput;
  label: string;
  helper?: string;
  locked?: boolean;
}[] = [
  { key: 'firstName', label: 'First name', locked: true },
  { key: 'lastName', label: 'Last name', locked: true },
  { key: 'email', label: 'Email', locked: true },
  { key: 'phone', label: 'Phone number' },
  { key: 'resume', label: 'Resume / CV', helper: 'PDF, max 5MB' },
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'portfolio', label: 'Portfolio URL' },
];

function SegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: FieldRequirement;
  onChange: (v: FieldRequirement) => void;
  disabled?: boolean;
}) {
  const options: { value: FieldRequirement; label: string }[] = [
    { value: 'off', label: 'Off' },
    { value: 'optional', label: 'Optional' },
    { value: 'required', label: 'Required' },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-card-hover p-0.5',
        disabled && 'opacity-60'
      )}
      role="radiogroup"
      aria-label="Field requirement"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded px-3 py-1.5 text-body-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-surface text-heading shadow-sm'
              : 'text-muted hover:text-heading',
            disabled && 'cursor-not-allowed'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function FormSection({
  scopeId,
  /**
   * The job wizard commits every section at once from its step footer, so the
   * per-section bar is hidden there. Workspace settings has no such footer and
   * keeps it.
   */
  showSaveBar = true,
}: {
  scopeId?: string;
  showSaveBar?: boolean;
}) {
  const { data, loading, update, save, saving, saved } = useCustomisationSave(
    getFormSettings,
    saveFormSettings,
    'form_fields_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('form', save);
  usePreviewSync('form', data);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const setField = (key: keyof FormSettingsInput, value: FieldRequirement) => {
    update({ [key]: value } as Partial<FormSettingsInput>);
    track('form_fields_updated', { field: key, value });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Form settings"
        description="Choose what information to collect from candidates."
      >
        {FIELDS.map((field) => (
          <SettingsRow
            key={field.key}
            label={field.label}
            helper={
              field.locked
                ? 'Always collected'
                : field.helper
            }
            control={
              field.locked ? (
                <div className="flex items-center gap-2">
                  <SegmentedControl
                    value={data[field.key] as FieldRequirement}
                    onChange={() => {}}
                    disabled
                  />
                  <Lock size={14} className="text-muted" />
                </div>
              ) : (
                <SegmentedControl
                  value={data[field.key] as FieldRequirement}
                  onChange={(v) => setField(field.key, v)}
                />
              )
            }
          />
        ))}

        <div className="border-t border-border" />

        <div className="px-4 py-3">
          <p className="text-body-sm text-muted">
            Only collect what this role actually needs. Everything you turn on is stored against the candidate's record.
          </p>
        </div>

        <div className="border-t border-border" />

        <SettingsRow
          label="Privacy policy"
          helper="Require candidates to agree to your privacy policy."
          control={
            <Switch
              checked={data.privacyPolicyEnabled}
              onCheckedChange={(v) => update({ privacyPolicyEnabled: v } as Partial<FormSettingsInput>)}
              aria-label="Enable privacy policy requirement"
            />
          }
        />
        {data.privacyPolicyEnabled && (
          <SettingsRow
            label="Privacy policy URL"
            control={
              <Input
                value={data.privacyPolicyUrl ?? ''}
                onChange={(e) => update({ privacyPolicyUrl: e.target.value } as Partial<FormSettingsInput>)}
                placeholder="https://yourcompany.com/privacy"
                aria-label="Privacy policy URL"
              />
            }
          />
        )}

        <SettingsRow
          label="Terms & conditions"
          helper="Require candidates to agree to your terms."
          control={
            <Switch
              checked={data.termsEnabled}
              onCheckedChange={(v) => update({ termsEnabled: v } as Partial<FormSettingsInput>)}
              aria-label="Enable terms requirement"
            />
          }
        />
        {data.termsEnabled && (
          <SettingsRow
            label="Terms URL"
            control={
              <Input
                value={data.termsUrl ?? ''}
                onChange={(e) => update({ termsUrl: e.target.value } as Partial<FormSettingsInput>)}
                placeholder="https://yourcompany.com/terms"
                aria-label="Terms URL"
              />
            }
          />
        )}
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
