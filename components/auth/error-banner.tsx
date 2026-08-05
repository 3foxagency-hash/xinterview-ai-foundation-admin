'use client';

import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ErrorBannerProps {
  message: string;
  className?: string;
}

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={{ opacity: 0, height: 0, y: -8 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div
          role="alert"
          aria-live="polite"
          className={cn(
            'flex w-full items-start gap-3 rounded-md border-l-4 border-error bg-error-banner-bg px-4 py-3',
            className
          )}
        >
          <AlertCircle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-error" />
          <p className="text-body-sm text-error">{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
