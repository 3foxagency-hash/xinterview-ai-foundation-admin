'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AuthButton } from './auth-button';

export interface SuccessPanelProps {
  icon: React.ReactNode;
  heading: string;
  body: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  actionLoading?: boolean;
  countdown?: React.ReactNode;
  className?: string;
}

export function SuccessPanel({
  icon,
  heading,
  body,
  actionLabel,
  onAction,
  actionLoading = false,
  countdown,
  className,
}: SuccessPanelProps) {
  return (
    <div className={cn('flex w-full max-w-[380px] flex-col items-center text-center', className)}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10"
      >
        {icon}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="mt-6 text-h2 font-semibold text-heading tracking-tight"
      >
        {heading}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.28 }}
        className="mt-2 text-body text-bodyText"
      >
        {body}
      </motion.p>
      {countdown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.35 }}
          className="mt-4"
        >
          {countdown}
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.4 }}
        className="mt-6 w-full"
      >
        <AuthButton
          type="button"
          size="lg"
          variant="primary"
          onClick={onAction}
          loading={actionLoading}
          className="w-full"
        >
          {actionLabel}
        </AuthButton>
      </motion.div>
    </div>
  );
}
