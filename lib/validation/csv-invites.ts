import { emailSchema } from '@/lib/validation/auth';

export const MAX_CSV_ROWS = 50;

export type CsvInviteRow = {
  firstName: string;
  lastName: string;
  email: string;
};

export type CsvInvalidRow = CsvInviteRow & {
  field: 'firstName' | 'lastName' | 'email';
  reason: string;
};

export type CsvValidationResult = {
  valid: CsvInviteRow[];
  invalid: CsvInvalidRow[];
  /** Rows beyond MAX_CSV_ROWS — not processed, just counted. */
  skippedCount: number;
};

const REQUIRED_HEADERS = ['first name', 'last name', 'email'];

/** Splits one CSV line on commas, respecting simple double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Validates a CSV file's text against the invite row shape, entirely
 * client-side. Never throws — every problem is returned as data so the
 * caller can render failed rows editable in place rather than rejecting
 * the whole file.
 */
export function validateInviteCsv(
  text: string,
  existingEmails: Set<string>
): CsvValidationResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { valid: [], invalid: [], skippedCount: 0 };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const firstNameIdx = header.indexOf('first name');
  const lastNameIdx = header.indexOf('last name');
  const emailIdx = header.indexOf('email');

  const missingHeaders = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  const dataLines = lines.slice(1);

  const capped = dataLines.slice(0, MAX_CSV_ROWS);
  const skippedCount = Math.max(0, dataLines.length - MAX_CSV_ROWS);

  const valid: CsvInviteRow[] = [];
  const invalid: CsvInvalidRow[] = [];
  const seenInFile = new Set<string>();

  for (const line of capped) {
    const cells = splitCsvLine(line);
    const firstName = missingHeaders.length === 0 ? (cells[firstNameIdx] ?? '') : (cells[0] ?? '');
    const lastName = missingHeaders.length === 0 ? (cells[lastNameIdx] ?? '') : (cells[1] ?? '');
    const email = missingHeaders.length === 0 ? (cells[emailIdx] ?? '') : (cells[2] ?? '');

    if (missingHeaders.length > 0) {
      invalid.push({
        firstName,
        lastName,
        email,
        field: 'email',
        reason: `Missing required column${missingHeaders.length > 1 ? 's' : ''}: ${missingHeaders.join(', ')}`,
      });
      continue;
    }

    if (!firstName) {
      invalid.push({ firstName, lastName, email, field: 'firstName', reason: 'First name is required' });
      continue;
    }
    if (!lastName) {
      invalid.push({ firstName, lastName, email, field: 'lastName', reason: 'Last name is required' });
      continue;
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      invalid.push({
        firstName,
        lastName,
        email,
        field: 'email',
        reason: email ? 'Not a valid email address' : 'Email is required',
      });
      continue;
    }

    const normalizedEmail = emailResult.data.toLowerCase();

    if (existingEmails.has(normalizedEmail)) {
      invalid.push({ firstName, lastName, email, field: 'email', reason: 'This email is already invited' });
      continue;
    }

    if (seenInFile.has(normalizedEmail)) {
      invalid.push({ firstName, lastName, email, field: 'email', reason: 'Duplicate email within this file' });
      continue;
    }

    seenInFile.add(normalizedEmail);
    valid.push({ firstName, lastName, email: emailResult.data });
  }

  return { valid, invalid, skippedCount };
}
