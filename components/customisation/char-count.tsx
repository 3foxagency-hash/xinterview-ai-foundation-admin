import { cn } from '@/lib/utils';

/**
 * Character counter for a capped text field.
 *
 * The live product shows `15/50 characters` under every limited input, which
 * tells you how much room is left before the field silently stops accepting
 * input. Turns red at the limit.
 */
export function CharCount({
  value,
  max,
  className,
}: {
  value: string;
  max: number;
  className?: string;
}) {
  const n = value.length;
  return (
    <p
      className={cn(
        'mt-1 text-right text-caption tabular-nums',
        n >= max ? 'font-medium text-error' : 'text-muted',
        className
      )}
    >
      {n}/{max} characters
    </p>
  );
}
