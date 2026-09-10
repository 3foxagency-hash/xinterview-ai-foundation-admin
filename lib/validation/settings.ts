import { z } from 'zod';
import { emailSchema } from './auth';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || /^https?:\/\/[^\s]+\.[^\s]+/.test(val),
    'Enter a valid website URL (e.g. https://company.com)'
  );

export const organizationSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  companyWebsite: optionalUrl,
  companySize: z.string().min(1, 'Please select a company size'),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[+\d][\d\s-]{4,}$/.test(val),
      'Enter a valid phone number'
    ),
  companyType: z.enum(['Corporate', 'Agency'], {
    message: 'Please select a company type',
  }),
  businessCategory: z.string().min(1, 'Please select a business category'),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['MA', 'EX']).default('EX'),
});

export const changeRoleSchema = z.object({
  role: z.enum(['MA', 'EX']),
});

export const deleteCompanySchema = z.object({
  confirmName: z.string().min(1, 'Type the company name to confirm'),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type DeleteCompanyInput = z.infer<typeof deleteCompanySchema>;
