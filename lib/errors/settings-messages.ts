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
  coupon_invalid:
    "That coupon code isn't valid or has expired. Check the code and try again.",
  template_name_required: 'Give your template a name.',
  template_duplicate: 'A template with this name already exists. Try a different name.',
  template_not_found: 'We could not find that template. Please refresh and try again.',
  api_key_name_required: 'Give your API key a name.',
  api_key_duplicate: 'An API key with this name already exists. Try a different name.',
  smtp_host_required: 'Enter your outgoing mail server hostname.',
  smtp_port_required: 'Enter your outgoing mail server port.',
  smtp_username_required: 'Enter the SMTP username.',
  smtp_password_required: 'Enter the SMTP password or app key.',
  smtp_from_required: 'Enter the address emails should be sent from.',
  smtp_test_failed: 'We could not send the test email. Check the address and try again.',
  domain_subdomain_required: 'Enter a subdomain.',
  domain_subdomain_invalid: 'Subdomains can only contain letters, numbers and hyphens.',
  domain_apex_invalid: 'Enter a valid domain, for example acme.com.',
  career_meta_title_long: 'Meta title is too long. Keep it to 60 characters.',
  career_meta_description_long:
    'Meta description is too long. Keep it to 160 characters.',
  email_subject_required: 'Enter a subject line.',
  email_body_required: 'Enter the email body.',
  email_template_not_found:
    'We could not find that template. Please refresh and try again.',
  sms_body_required: 'Enter the message body.',
  sms_body_too_long: 'This message is too long. Keep it under 480 characters.',
  sms_template_not_found:
    'We could not find that template. Please refresh and try again.',
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
