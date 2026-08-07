'use client';

import * as React from 'react';
import { Clock, Loader2, ShieldCheck, Sparkles, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { SegmentedControl } from '@/components/settings/segmented-control';
import { UsageDial } from '@/components/settings/usage-dial';
import { CreditBreakdownPopover } from '@/components/settings/credit-breakdown';
import { PlanCard } from '@/components/settings/plan-card';
import { BillingSkeleton } from '@/components/settings/billing-skeleton';
import {
  getCurrentPlan,
  getSubscriptionPlans,
  applyCoupon,
  getOrganization,
  type CurrentPlan,
  type SubscriptionPlan,
} from '@/lib/api/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

/** Whole days from today to an ISO date; null when the date is unparseable. */
function daysUntil(iso: string): number | null {
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000));
}

export default function BillingPage() {
  const [plan, setPlan] = React.useState<CurrentPlan | null>(null);
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [companyName, setCompanyName] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);

  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('annual');
  const [coupon, setCoupon] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  /** Set once a coupon is accepted — drives the struck-through plan pricing. */
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    code: string;
    discountPct: number;
  } | null>(null);
  const [upgrading, setUpgrading] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, list, org] = await Promise.all([
          getCurrentPlan(),
          getSubscriptionPlans(),
          getOrganization(),
        ]);
        if (cancelled) return;
        setPlan(p);
        setPlans(list);
        setCompanyName(org.name);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponLoading(true);
    try {
      const { discountPct } = await applyCoupon(coupon);
      setAppliedCoupon({ code: coupon.trim().toUpperCase(), discountPct });
      toast.success(`Coupon applied — ${discountPct}% off every plan.`);
      setCoupon('');
    } catch (err) {
      setCouponError(getSettingsErrorMessage(err));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    // Checkout is not wired up yet; the real flow will hand off to the payment
    // provider from here.
    await new Promise((r) => setTimeout(r, 700));
    setUpgrading(null);
    const target = plans.find((p) => p.id === planId);
    toast.info(`Checkout for ${target?.name ?? 'this plan'} is coming soon.`);
  };

  if (loading || !plan) return <BillingSkeleton />;

  const annual = billingCycle === 'annual';
  // Derived after the loading gate, so it only ever runs client-side — comparing
  // against Date.now() during SSR would hydrate to a different number.
  const daysLeft = daysUntil(plan.activeUntilIso);

  return (
    <SettingsPage
      title="Billing & plan"
      scope="company"
      companyName={companyName}
      description="Your current plan, usage against its limits, and the plans you can move to."
    >
      {/* ── Plan hero: status, renewal countdown and usage in one band ── */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="relative bg-hero-gradient px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-2.5 py-1 text-caption font-medium text-heading backdrop-blur">
                  <Sparkles size={12} className="text-primary" aria-hidden />
                  {plan.isTrial ? 'Free trial' : 'Current plan'}
                </span>
                {daysLeft !== null && daysLeft <= 30 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-caption font-medium text-warning">
                    <Clock size={12} aria-hidden />
                    {daysLeft} days left
                  </span>
                )}
              </div>
              <h2 className="mt-2.5 text-h1 text-heading">{plan.name}</h2>
              <p className="mt-1 text-body-sm text-bodyText">{plan.tagline}</p>
            </div>

            <div className="w-fit shrink-0 rounded-lg bg-surface/80 px-4 py-3 backdrop-blur sm:text-right">
              <p className="text-caption text-muted">Active until</p>
              <p className="mt-0.5 text-body font-semibold text-heading">{plan.activeUntil}</p>
              {daysLeft !== null && (
                <p className="mt-0.5 text-caption text-muted">
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Usage reads as a scannable row of dials, not a list of bars. */}
        <div className="border-t border-border px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-body font-semibold text-heading">Usage this period</h3>
              <p className="mt-0.5 text-body-sm text-muted">
                Resets when your plan renews.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {plan.usage.map((m) => (
              <UsageDial
                key={m.id}
                metric={m}
                adornment={
                  m.id === 'credits' ? (
                    <CreditBreakdownPopover
                      items={plan.creditBreakdown}
                      total={{ used: m.used, limit: m.limit }}
                    />
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans, with the coupon beside the prices it discounts ── */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-h3 text-heading">Change plan</h2>
            <p className="mt-1 text-body-sm text-muted">
              Pick the plan that matches how much hiring you do.
            </p>
          </div>
          <div className="w-full shrink-0 sm:w-[260px]">
            <SegmentedControl
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual −20%' },
              ]}
              value={billingCycle}
              onChange={(v) => setBillingCycle(v as 'monthly' | 'annual')}
            />
          </div>
        </div>

        {/* Coupon sits directly above the prices it changes. */}
        <div className="mt-4">
          {appliedCoupon ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
              <Tag size={14} className="shrink-0 text-success" aria-hidden />
              <span className="text-body-sm font-medium text-heading">
                {appliedCoupon.code}
              </span>
              <span className="text-body-sm font-medium text-success">
                &minus;{appliedCoupon.discountPct}% applied to every plan
              </span>
              <button
                type="button"
                onClick={() => setAppliedCoupon(null)}
                aria-label={`Remove coupon ${appliedCoupon.code}`}
                className="ml-auto rounded p-1 text-muted transition-colors hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleCoupon} noValidate>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Tag
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <input
                    id="coupon"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      setCouponError(null);
                    }}
                    placeholder="Have a coupon code?"
                    aria-label="Coupon code"
                    aria-invalid={!!couponError}
                    aria-describedby={couponError ? 'coupon-error' : undefined}
                    className={cn(
                      'h-10 w-full rounded-lg border bg-surface pl-8 pr-3 text-body text-heading placeholder:text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10',
                      couponError
                        ? 'border-error'
                        : 'border-border hover:border-border-strong focus-visible:border-primary'
                    )}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!coupon.trim() || couponLoading}
                  aria-busy={couponLoading}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
                >
                  {couponLoading && <Loader2 size={14} className="animate-spin" />}
                  Apply
                </button>
              </div>
              {couponError ? (
                <p id="coupon-error" role="alert" className="mt-1.5 text-body-sm text-error">
                  {couponError}
                </p>
              ) : (
                <p className="mt-1.5 text-caption text-muted">Try LAUNCH20 for 20% off.</p>
              )}
            </form>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              annual={annual}
              isCurrent={p.id === plan.planId}
              loading={upgrading === p.id}
              discountPct={appliedCoupon?.discountPct ?? 0}
              onSelect={handleUpgrade}
            />
          ))}
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-body-sm text-muted">
          <ShieldCheck size={14} className="shrink-0" aria-hidden />
          All plans include a 14-day money-back guarantee.
        </p>
      </section>
    </SettingsPage>
  );
}
