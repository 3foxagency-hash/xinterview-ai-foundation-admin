'use client';

import * as React from 'react';
import { OTPInput as OTPInputBase, type SlotProps } from 'input-otp';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AuthOTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  maxLength?: number;
  id?: string;
  groupLabel?: string;
  errorMessage?: string;
}

function SlotBox({ slot, error }: { slot: SlotProps; error: boolean }) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-md border text-body-lg font-medium text-heading transition-colors',
        error ? 'border-error' : 'border-border',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background',
        slot.isActive && !error && 'border-primary'
      )}
    >
      {slot.char ? (
        <motion.span
          key={slot.char}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {slot.char}
        </motion.span>
      ) : slot.isActive ? (
        <span className="h-5 w-px animate-pulse bg-primary" />
      ) : null}
    </div>
  );
}

const AuthOTPInput = React.forwardRef<HTMLInputElement, AuthOTPInputProps>(
  ({ value, onChange, error = false, maxLength = 6, id, groupLabel = 'One-time code', errorMessage = 'Invalid code' }, _ref) => {
    return (
      <div className="flex flex-col items-center gap-2">
        <OTPInputBase
          id={id}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="^[0-9]+$"
          autoFocus
          aria-label={groupLabel}
          containerClassName="flex items-center gap-2"
          render={({ slots }) => (
            <div className="flex items-center gap-2" role="group" aria-label={groupLabel}>
              {slots.map((slot: SlotProps, idx: number) => (
                <SlotBox key={idx} slot={slot} error={error} />
              ))}
            </div>
          )}
        />
        {error && (
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 0.4 }}
            className="w-full text-center text-caption text-error"
            role="alert"
          >
            {errorMessage}
          </motion.div>
        )}
      </div>
    );
  }
);
AuthOTPInput.displayName = 'AuthOTPInput';

export { AuthOTPInput };
