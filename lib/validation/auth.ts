import { z } from 'zod';
import { isDisposableEmail } from '@/lib/constants/disposable-domains';
import { isCommonPassword } from '@/lib/constants/common-passwords';

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .refine((email) => !isDisposableEmail(email), {
    message: 'Please use a valid business or personal email address. Temporary email addresses are not supported.',
  });

export const passwordSchema = passwordRules;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: emailSchema,
    password: passwordRules,
  })
  .refine((data) => data.password !== data.email, {
    message: 'Your password cannot be the same as your email address',
    path: ['password'],
  })
  .refine((data) => !isCommonPassword(data.password), {
    message: 'That password is too common. Please choose a stronger one.',
    path: ['password'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const otpSchema = z
  .string()
  .min(6, 'Enter all 6 digits')
  .max(6, 'Enter exactly 6 digits')
  .regex(/^\d{6}$/, 'Code must be 6 digits');

export const resetPasswordSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => !isCommonPassword(data.password), {
    message: 'That password is too common. Please choose a stronger one.',
    path: ['password'],
  });

export const companySetupSchema = z.object({
  companySize: z.string().min(1, 'Please select a company size'),
  companyName: z.string().min(1, 'Company name is required'),
  companyType: z.string().min(1, 'Please select a company type'),
  companyWebsite: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/[^\s]+\.[^\s]+/.test(val),
      'Enter a valid website URL (e.g. https://company.com)'
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CompanySetupInput = z.infer<typeof companySetupSchema>;
