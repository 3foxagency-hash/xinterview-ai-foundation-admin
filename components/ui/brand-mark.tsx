import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * XInterview wordmark. Swaps light/dark artwork via CSS so it stays correct
 * through SSR and theme changes without a hydration flash.
 */
export function BrandWordmark({ className, height = 24 }: { className?: string; height?: number }) {
  const width = height * (888 / 172);

  return (
    <span className={cn('relative inline-block shrink-0', className)} style={{ height, width }}>
      <Image
        src="/logos/banner.png"
        alt="XInterview"
        fill
        priority
        className="object-contain dark:hidden"
      />
      <Image
        src="/logos/banner-white.png"
        alt="XInterview"
        fill
        priority
        className="hidden object-contain dark:block"
      />
    </span>
  );
}

/** Square favicon-style mark, used where the sidebar rail is collapsed. */
export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={cn('relative inline-block shrink-0', className)} style={{ height: size, width: size }}>
      <Image src="/logos/favicon.png" alt="XInterview" fill priority className="object-contain" />
    </span>
  );
}
