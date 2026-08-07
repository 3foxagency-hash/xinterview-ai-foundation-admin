import type { ApiError } from '@/lib/api/auth';

const SETTINGS_MESSAGES: Record<string, string> = {
  seat_limit_reached:
    "You've used all your seats. Remove a member or upgrade your plan on the Billing & plan page to invite more people.",
  already_member:
    'This person is already a member of your team. Try a different email.',
  already_invited:
    'An invite has already been sent to this email. You can resend it from the team list.',
  permission_denied:
    "Only owners and admins can do this. Ask a workspace owner or admin to make the change for you.",
  invite_failed:
    'We could not send the invite. Please check the email address and try again.',
  role_change_failed:
    'We could not change this role. Please try again.',
  removal_failed:
    'We could not remove this member. Please try again.',
  resend_failed:
    'We could not resend the invite. Please try again.',
  cancel_invite_failed:
    'We could not cancel this invite. Please try again.',
  upload_failed:
    'We could not upload the logo. Please try a different file.',
  save_failed:
    'We could not save your changes. Please try again.',
  roster_load_failed:
    'We could not load your team. Please try again.',
};

const FALLBACK = 'Something went wrong. Please try again.';

export function getSettingsErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as ApiError).code;
    return SETTINGS_MESSAGES[code] ?? FALLBACK;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK;
}

export function getSettingsErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as ApiError).code;
  }
  return null;
}
