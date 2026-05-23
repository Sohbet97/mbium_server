import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Crown, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('ru', { day: '2-digit', month: 'long', year: 'numeric' })
}

function daysLeft(date) {
  if (!date) return null
  return Math.ceil((new Date(date) - new Date()) / 86_400_000)
}

// ── Single feature row ────────────────────────────────────────────────────────
function FeatRow({ label, value, isBool, t }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b last:border-0 dark:border-white/[0.06]">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      {isBool ? (
        value
          ? <Check className="h-4 w-4 text-green-500" />
          : <X className="h-4 w-4 text-slate-300 dark:text-white/20" />
      ) : (
        <span className="font-medium dark:text-white">{value}</span>
      )}
    </div>
  )
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, isCurrent, t }) {
  const free = Number(plan.price_monthly) === 0
  const LIVE_LABELS = [t('seller.liveNone'), t('seller.liveViewOnly'), t('seller.liveLimited'), t('seller.liveUnlimited')]

  return (
    <Card className={cn(
      'flex flex-col transition-shadow',
      isCurrent
        ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-md'
        : 'hover:shadow-md'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{plan.display_name_tm || plan.name}</CardTitle>
            {plan.display_name_ru && (
              <p className="text-xs text-slate-400 mt-0.5">{plan.display_name_ru}</p>
            )}
          </div>
          {isCurrent && (
            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
              {t('seller.currentPlanBadge')}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {free ? t('seller.freePlan') : plan.price_monthly}
          </span>
          {!free && <span className="text-sm text-slate-400">{t('seller.perMonth')}</span>}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('seller.commission')}: {(Number(plan.commission_rate) * 100).toFixed(0)}%
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-0">
        <FeatRow label={t('seller.productLimit')}   value={plan.product_limit ?? '∞'} t={t} />
        <FeatRow label={t('seller.aiCredits')}      value={plan.ai_credits_monthly} t={t} />
        <FeatRow label={t('seller.auctionPerWeek')} value={plan.auction_per_week ?? '∞'} t={t} />
        <FeatRow label={t('seller.liveStream')}     value={LIVE_LABELS[plan.live_stream_mode ?? 0]} t={t} />
        <FeatRow
          label={t('seller.hotspot')}
          value={plan.hotspot_per_month > 0
            ? `${plan.hotspot_per_month} × ${plan.hotspot_duration_hrs}s`
            : '—'}
          t={t}
        />
        <FeatRow label={t('seller.pushNotif')}      value={plan.push_notif_monthly || '—'} t={t} />
        <FeatRow label={t('seller.adsDashboard')}   isBool value={plan.ads_dashboard} t={t} />
        <FeatRow label={t('seller.coinEarn')}       isBool value={plan.coin_earn} t={t} />
        <FeatRow label={t('seller.coinPriority')}   isBool value={plan.coin_earn_priority} t={t} />
        <FeatRow label={t('seller.verifiedBadge')}  isBool value={plan.verified_badge} t={t} />
        <FeatRow label={t('seller.virtualTour')}    isBool value={plan.virtual_tour} t={t} />
        <FeatRow label={t('seller.oemSupport')}     isBool value={plan.oem_odm_support} t={t} />
      </CardContent>

      {!isCurrent && (
        <div className="p-4 pt-3">
          <a
            href="mailto:support@mbium.tm?subject=Plan üýtgetmek haýyşy"
            className="flex items-center justify-center gap-1.5 w-full text-sm px-4 py-2 rounded-lg border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('seller.contactSupport')}
          </a>
        </div>
      )}
    </Card>
  )
}

// ── Subscription status banner ────────────────────────────────────────────────
function SubscriptionBanner({ sub, t }) {
  if (!sub) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-white/[0.10] p-6 text-center">
        <Crown className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-white/20" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('seller.noPlan')}</p>
        <p className="text-xs text-slate-400 mt-1">
          {t('seller.noPlanDesc')}{' '}
          <a href="mailto:support@mbium.tm" className="text-blue-600 dark:text-blue-400 hover:underline">
            support@mbium.tm
          </a>
        </p>
      </div>
    )
  }

  const left    = daysLeft(sub.ends_at)
  const expired = sub.ends_at && left !== null && left < 0
  const expiring = left !== null && left >= 0 && left <= 30

  return (
    <div className={cn(
      'rounded-xl border p-5 flex items-start gap-4',
      expired
        ? 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20'
        : expiring
          ? 'border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20'
          : 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-950/20'
    )}>
      <div className={cn(
        'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
        expired ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'
      )}>
        <Crown className={cn('h-5 w-5', expired ? 'text-red-500' : 'text-green-600 dark:text-green-400')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-bold dark:text-white">
            {sub.plan?.display_name_tm || sub.plan?.name || 'Plan'}
          </p>
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-semibold',
            expired
              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
          )}>
            {expired ? t('seller.planExpired') : t('seller.planActive')}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{t('seller.planStartedAt')}: <strong className="text-slate-700 dark:text-slate-200">{fmtDate(sub.starts_at)}</strong></span>
          <span>
            {t('seller.planEndsAt')}:{' '}
            <strong className={cn(expired ? 'text-red-600' : expiring ? 'text-amber-600' : 'text-slate-700 dark:text-slate-200')}>
              {sub.ends_at ? fmtDate(sub.ends_at) : t('seller.planNoExpiry')}
            </strong>
          </span>
        </div>

        {expired && (
          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium mt-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t('seller.expiredMsg')}
          </p>
        )}
        {expiring && !expired && (
          <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium mt-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {t('seller.daysLeft', { count: left })}
          </p>
        )}
        {sub.note && (
          <p className="text-xs text-slate-400 mt-1 italic">"{sub.note}"</p>
        )}
      </div>
    </div>
  )
}

// ── Key metrics strip for current plan ───────────────────────────────────────
function CurrentPlanMetrics({ plan, t }) {
  if (!plan) return null
  const metrics = [
    { label: t('seller.commission'),     value: `${(Number(plan.commission_rate) * 100).toFixed(0)}%` },
    { label: t('seller.productLimit'),   value: plan.product_limit ?? '∞' },
    { label: t('seller.aiCredits'),      value: plan.ai_credits_monthly },
    { label: t('seller.auctionPerWeek'), value: plan.auction_per_week ?? '∞' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map(({ label, value }) => (
        <div key={label} className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border dark:border-white/[0.06] px-4 py-3 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  1: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  3: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function SubStatusBadge({ status, t }) {
  const label = status === 1
    ? t('seller.planActive')
    : status === 2
      ? t('seller.subStatusCancelled')
      : t('seller.planExpired')
  return (
    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', STATUS_STYLES[status] ?? STATUS_STYLES[3])}>
      {label}
    </span>
  )
}

// ── Subscription history ──────────────────────────────────────────────────────
function SubscriptionHistory({ history, t }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
        {t('seller.subscriptionHistory')}
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">{t('seller.noHistory')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.currentPlanBadge')}</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.subscriptionTitle').split(' ')[0]}</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.planStartedAt')}</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.planEndsAt')}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b last:border-0 dark:border-white/[0.06]',
                    i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-white/[0.01]'
                  )}
                >
                  <td className="px-4 py-3 font-medium dark:text-white">
                    {item.plan?.display_name_tm || item.plan?.name || '—'}
                    {item.plan?.display_name_ru && (
                      <span className="block text-xs text-slate-400">{item.plan.display_name_ru}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SubStatusBadge status={item.status} t={t} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {fmtDate(item.starts_at) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {item.ends_at ? fmtDate(item.ends_at) : <span className="text-slate-300 dark:text-white/30">{t('seller.planNoExpiry')}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 italic max-w-[180px] truncate">
                    {item.note ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerSubscriptionPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [plans, setPlans]     = useState([])
  const [sub, setSub]         = useState(undefined)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      SellerApi.plans.getAll(),
      SellerApi.plans.getSubscription(),
      SellerApi.plans.getHistory(),
    ])
      .then(([plansRes, subRes, historyRes]) => {
        setPlans(plansRes.data.data ?? [])
        setSub(subRes.data.model ?? null)
        setHistory(historyRes.data.data ?? [])
      })
      .catch(() => { setSub(null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  // Fallback to shop.plan_id if there's no active subscription record
  const currentPlanId = sub?.plan_id ?? user?.shop?.plan_id ?? null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold dark:text-white">{t('seller.subscriptionTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {t('seller.subscriptionSubtitle')}
        </p>
      </div>

      {/* Current subscription banner */}
      <SubscriptionBanner sub={sub} t={t} />

      {/* Current plan key metrics */}
      {sub?.plan && <CurrentPlanMetrics plan={sub.plan} t={t} />}

      {/* Subscription history */}
      <SubscriptionHistory history={history} t={t} />

      {/* Plans comparison */}
      {plans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            {currentPlanId ? t('seller.otherPlans') : t('seller.availablePlans')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.id === currentPlanId}
                t={t}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            {t('seller.planFooter')}{' '}
            <a href="mailto:support@mbium.tm" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@mbium.tm
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
