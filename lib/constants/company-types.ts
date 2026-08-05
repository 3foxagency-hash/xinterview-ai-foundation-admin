export const COMPANY_TYPES = [
  'Private Limited Company / LTD',
  'C-Corp',
  'S-Corp',
  'LLC',
  'Partnership',
  'Sole Proprietorship',
  'Non-profit',
  'Other',
] as const;

export type CompanyType = (typeof COMPANY_TYPES)[number];
