'use client';

import * as React from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthInput } from './auth-input';
import { cn } from '@/lib/utils';
import {
  getPasswordChecks,
  getPasswordStrength,
  strengthConfig,
} from '@/lib/utils/password';

export interface AuthPasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  showStrength?: boolean;
  leadingIcon?: React.ReactNode;
}

const AuthPasswordField = React.forwardRef<HTMLInputElement, AuthPasswordFieldProps>(
  (
    {
      label,
      description,
      error,
      showStrength = false,
      leadingIcon,
      id,
      value: propValue,
      onChange: propOnChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = React.useState(false);
    const [value, setValue] = React.useState(props.defaultValue as string ?? '');

    const currentValue = typeof propValue === 'string' ? propValue : value;

    const checks = React.useMemo(() => getPasswordChecks(currentValue), [currentValue]);
    const strength = React.useMemo(() => getPasswordStrength(currentValue), [currentValue]);
    const cfg = strengthConfig[strength];

    return (
      <div className="w-full">
        <AuthInput
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          label={label}
          description={description}
          error={error}
          leadingIcon={leadingIcon}
          value={currentValue}
          onChange={(e) => {
            setValue(e.target.value);
            propOnChange?.(e);
          }}
          className="pr-11"
          trailingControl={
            <button
              type="button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              onClick={() => setVisible((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded text-muted transition-colors hover:text-heading"
            >
              {visible ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
            </button>
          }
          {...props}
        />

        {showStrength && currentValue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-2.5"
          >
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < cfg.segments ? cfg.color : 'bg-border'
                  )}
                />
              ))}
            </div>
            {cfg.label && (
              <p className="text-caption text-muted">
                Password strength: <span className="font-medium text-heading">{cfg.label}</span>
              </p>
            )}
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    'flex items-center gap-1 text-caption',
                    c.passed ? 'text-success' : 'text-muted'
                  )}
                >
                  {c.passed ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    <X size={12} strokeWidth={2.5} />
                  )}
                  {c.label}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    );
  }
);
AuthPasswordField.displayName = 'AuthPasswordField';

export { AuthPasswordField };
