'use client';

import * as React from 'react';
import { Loader2, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { SettingsSection } from '@/components/settings/settings-section';
import { SegmentedControl } from '@/components/settings/segmented-control';
import { UsageMeter } from '@/components/settings/usage-meter';
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

  return (
    <SettingsPage
      title="Billing & plan"
      scope="company"
      companyName={companyName}
      description="Your current plan, usage against its limits, and the plans you can move to."
    >
      {/* ── Current plan ── */}
      <SettingsSection
        title="Current plan"
        description="The plan you're on today."
      >
        {/* Plan name on the left, renewal on the right, coupon underneath. */}
        <div className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-body font-medium text-heading">
                Your current plan is {plan.name}
              </p>
              <p className="mt-0.5 text-body-sm text-muted">{plan.tagline}</p>
            </div>

            <div className="shrink-0 sm:text-right">
              <p className="text-body-sm font-medium text-heading">
                Active until {plan.activeUntil}
              </p>
              <p className="mt-0.5 text-body-sm text-muted">
                We&apos;ll notify you before it expires.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            {appliedCoupon ? (
              <div>
                <p className="text-body-sm font-medium text-heading">Coupon applied</p>
                <div className="mt-1.5 flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2">
                  <Tag size={14} className="shrink-0 text-success" aria-hidden />
                  <span className="text-body-sm font-medium text-heading">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-body-sm text-success">
                    &minus;{appliedCoupon.discountPct}%
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
                <p className="mt-1.5 text-body-sm text-muted">
                  Applied to the plan prices below.
                </p>
              </div>
            ) : (
            <form onSubmit={handleCoupon} noValidate className="flex flex-col gap-1.5">
              <label htmlFor="coupon" className="text-body-sm font-medium text-heading">
                Apply coupon code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
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
                    placeholder="Enter coupon code"
                    aria-invalid={!!couponError}
                    aria-describedby={couponError ? 'coupon-error' : undefined}
                    className={cn(
                      'h-10 w-full rounded-md border bg-background pl-8 pr-3 text-body text-heading placeholder:text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10',
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
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50"
                >
                  {couponLoading && <Loader2 size={14} className="animate-spin" />}
                  Apply
                </button>
              </div>
              {couponError && (
                <p id="coupon-error" role="alert" className="text-body-sm text-error">
                  {couponError}
                </p>
              )}
              <p className="text-caption text-muted">Try LAUNCH20 for 20% off.</p>
            </form>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* ── Usage ── */}
      <SettingsSection
        title="Usage"
        description="How much of your plan's allowance you've used this period."
      >
        <div className="grid gap-5 p-4 md:grid-cols-2 md:gap-x-8">
          {plan.usage.map((m) => (
            <UsageMeter
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
      </SettingsSection>

      {/* ── Subscription plans ── */}
      <SettingsSection
        title="Subscription plans"
        description="Choose a plan that matches how much hiring you do."
      >
        <div className="p-4">
          <div className="mx-auto mb-6 w-full max-w-[280px]">
            <SegmentedControl
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual' },
              ]}
              value={billingCycle}
              onChange={(v) => setBillingCycle(v as 'monthly' | 'annual')}
            />
            <p className="mt-2 text-center text-caption text-muted">
              {annual ? 'Save around 20% paying annually.' : 'Switch to annual to save around 20%.'}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
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

          <p className="mt-5 text-center text-body-sm text-muted">
            All plans include a 14-day money-back guarantee.
          </p>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
