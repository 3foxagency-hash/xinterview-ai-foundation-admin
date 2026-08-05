export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  const visible = localPart.charAt(0);
  return `${visible}•••@${domain}`;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
