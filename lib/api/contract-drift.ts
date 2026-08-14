/**
 * Compile-time guard: hand-written contract vs. the backend's OpenAPI spec.
 *
 * `lib/api/auth-contract.ts` is written by hand so the app can talk in clean
 * types (and so fields nothing reads are omitted). That hand-written layer can
 * silently drift from the backend. This file makes drift a **build error**
 * rather than a production surprise.
 *
 * How it works: each `Exact<A, B>` below fails to compile unless the two types
 * are mutually assignable. Regenerate the spec (`npm run api:types`), and if the
 * backend changed an enum or a field type, `tsc` names the mismatch here.
 *
 * Nothing imports this file — it exists purely to be type-checked. It compiles
 * to nothing and never reaches a bundle.
 */

import type { components } from './generated/schema';
import type { AccountType, BusinessType } from './auth-contract';

/** Resolves to `never` unless A and B are mutually assignable. */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

// ─── Company onboarding enums ───
//
// The values the API accepts are not guessable — `Corporate` and `LLC` both
// look right and are both rejected. These two assertions are what stop the
// signup form from silently regressing to a display label.

type _AccountTypeMatchesSpec = Exact<
  AccountType,
  components['schemas']['AccountTypeEnum']
>;

type _BusinessTypeMatchesSpec = Exact<
  BusinessType,
  components['schemas']['BusinessTypeEnum']
>;

// Referencing the aliases is what triggers the check; `never` fails to assign.
const _accountTypeOk: _AccountTypeMatchesSpec = true;
const _businessTypeOk: _BusinessTypeMatchesSpec = true;

export type ContractDriftChecks = {
  accountType: typeof _accountTypeOk;
  businessType: typeof _businessTypeOk;
};
