'use client';

import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/api/settings';

interface PlanCardProps {
  plan: SubscriptionPlan;
  annual: boolean;
  isCurrent: boolean;
  loading?: boolean;
  /** Percentage off from an applied coupon, 0 when none */
  discountPct?: number;
  onSelect: (planId: string) => void;
}

export function PlanCard({
  plan,
  annual,
  isCurrent,
  loading,
  discountPct = 0,
  onSelect,
}: PlanCardProps) {
  const listPrice = annual ? plan.annualPrice : plan.monthlyPrice;
  const discounted = discountPct > 0;
  const price = discounted
    ? Math.round(listPrice * (1 - discountPct / 100))
    : listPrice;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border bg-surface p-5 transition-colors',
        plan.popular ? 'border-primary shadow-md' : 'border-border'
      )}
    >
      {plan.popular && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-2.5 py-0.5 text-caption font-semibold text-primary-foreground">
          Popular
        </span>
      )}

      <h3 className="text-h3 text-heading">{plan.name}</h3>
      <p className="mt-1 text-body-sm text-muted">{plan.audience}</p>

      <div className="mt-4">
        {discounted && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-body text-muted line-through tabular-nums">
              ${listPrice}
            </span>
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-caption font-semibold text-success">
              {discountPct}% off
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-body-sm text-muted">$</span>
          <span
            className={cn(
              'text-display tabular-nums',
              discounted ? 'text-success' : 'text-heading'
            )}
          >
            {price}
          </span>
          <span className="text-body-sm text-muted">/ month</span>
        </div>
        {discounted && (
          <span className="sr-only">
            Discounted from ${listPrice} to ${price} per month.
          </span>
        )}
      </div>
      {annual && (
        <p className="mt-1 text-caption text-muted">Billed annually</p>
      )}

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2">
            {f.included ? (
              <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-success" aria-hidden />
            ) : (
              <X size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            )}
            <span className={cn('text-body-sm', f.included ? 'text-bodyText' : 'text-muted line-through')}>
              {f.label}
            </span>
            <span className="sr-only">{f.included ? 'included' : 'not included'}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        disabled={isCurrent || loading}
        aria-busy={loading}
        className={cn(
          'mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-button transition-colors',
          isCurrent
            ? 'cursor-default border border-border bg-muted-bg text-muted'
            : plan.popular
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover'
              : 'border border-primary/30 text-primary hover:bg-active-menu-bg',
          loading && 'opacity-70'
        )}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {isCurrent ? 'Current plan' : 'Upgrade plan'}
      </button>
    </div>
  );
}
