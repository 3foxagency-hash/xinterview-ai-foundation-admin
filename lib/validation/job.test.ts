import { describe, it, expect } from 'vitest';
import { jobSetupSchema } from './job';

function futureDate(daysFromNow = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function pastDate(daysAgo = 5): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function baseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    format: 'ai_video',
    title: 'Senior Frontend Engineer',
    timezone: 'Europe/London',
    interviewLanguage: 'en-GB',
    applicationDeadline: futureDate(),
    locationType: 'remote',
    location: '',
    ...overrides,
  };
}

describe('jobSetupSchema — required fields', () => {
  it('rejects a missing/too-short title', () => {
    const result = jobSetupSchema.safeParse(baseInput({ title: 'A' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'title')).toBe(true);
    }
  });

  it('rejects an empty timezone', () => {
    const result = jobSetupSchema.safeParse(baseInput({ timezone: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'timezone')).toBe(true);
    }
  });

  it('rejects an empty interview language', () => {
    const result = jobSetupSchema.safeParse(baseInput({ interviewLanguage: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'interviewLanguage')).toBe(true);
    }
  });

  it('rejects a missing application deadline', () => {
    const result = jobSetupSchema.safeParse(baseInput({ applicationDeadline: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'applicationDeadline')).toBe(true);
    }
  });

  it('accepts a fully valid payload', () => {
    const result = jobSetupSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });
});

describe('jobSetupSchema — application deadline must be in the future', () => {
  it('rejects a past deadline', () => {
    const result = jobSetupSchema.safeParse(baseInput({ applicationDeadline: pastDate() }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) => i.path[0] === 'applicationDeadline' && i.message === 'Pick a date in the future.'
        )
      ).toBe(true);
    }
  });

  it('accepts a future deadline', () => {
    const result = jobSetupSchema.safeParse(baseInput({ applicationDeadline: futureDate() }));
    expect(result.success).toBe(true);
  });
});

describe('jobSetupSchema — Remote/location interaction', () => {
  it('requires a location for on-site roles', () => {
    const result = jobSetupSchema.safeParse(baseInput({ locationType: 'on_site', location: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'location')).toBe(true);
    }
  });

  it('requires a location for hybrid roles', () => {
    const result = jobSetupSchema.safeParse(baseInput({ locationType: 'hybrid', location: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'location')).toBe(true);
    }
  });

  it('accepts an on-site role with a location', () => {
    const result = jobSetupSchema.safeParse(
      baseInput({ locationType: 'on_site', location: 'London, UK' })
    );
    expect(result.success).toBe(true);
  });

  it('does not require a location for remote roles', () => {
    const result = jobSetupSchema.safeParse(baseInput({ locationType: 'remote', location: '' }));
    expect(result.success).toBe(true);
  });
});
