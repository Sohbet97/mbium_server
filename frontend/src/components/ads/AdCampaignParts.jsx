import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { fmtTmt, taskName } from './adFormat'

// Shared by the admin and seller ad pages: status badges, the money summary and the tasks table

const CAMPAIGN_COLORS = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  active:   'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  finished: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400',
}
const COMPLETION_COLORS = {
  pending:  CAMPAIGN_COLORS.pending,
  approved: CAMPAIGN_COLORS.active,
  rejected: CAMPAIGN_COLORS.rejected,
}

export function CampaignStatusBadge({ status }) {
  const { t } = useTranslation()
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', CAMPAIGN_COLORS[status])}>
      {t(`ads.status_${status}`, status)}
    </span>
  )
}

export function CompletionStatusBadge({ status }) {
  const { t } = useTranslation()
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', COMPLETION_COLORS[status])}>
      {t(`ads.completion_${status}`, status)}
    </span>
  )
}

// Budget split and pool usage, as in the spec's ad dashboard
export function CampaignSummary({ campaign }) {
  const { t } = useTranslation()
  const pool = Number(campaign.user_pool) || 0
  const usedPct = pool ? Math.min(100, ((Number(campaign.spent) + Number(campaign.reserved)) / pool) * 100) : 0
  const items = [
    [t('ads.budget'), fmtTmt(campaign.budget)],
    [`${t('ads.userPool')} (${campaign.user_percent}%)`, fmtTmt(campaign.user_pool)],
    [t('ads.platformFee'), fmtTmt(campaign.platform_fee)],
    [t('ads.spent'), fmtTmt(campaign.spent)],
    [t('ads.reserved'), fmtTmt(campaign.reserved)],
    [t('ads.remaining'), fmtTmt(campaign.remaining)],
    ...(campaign.users_count != null ? [[t('ads.usersCount'), campaign.users_count]] : []),
  ]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 dark:bg-white/[0.04] px-3 py-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-sm font-semibold tabular-nums dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${usedPct}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          {fmtTmt(Number(campaign.spent) + Number(campaign.reserved))} / {fmtTmt(campaign.user_pool)}
        </p>
      </div>
    </div>
  )
}

export function CampaignTasksTable({ tasks = [] }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="overflow-x-auto rounded-lg border dark:border-white/[0.06]">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-500">
          <tr>
            <th className="text-left px-3 py-2 font-medium">{t('ads.task')}</th>
            <th className="text-right px-3 py-2 font-medium">{t('ads.price')}</th>
            <th className="text-right px-3 py-2 font-medium">{t('ads.limit')}</th>
            <th className="text-right px-3 py-2 font-medium">{t('ads.done')}</th>
            <th className="text-right px-3 py-2 font-medium">{t('ads.pendingCount')}</th>
            <th className="text-right px-3 py-2 font-medium">{t('ads.spent')}</th>
            <th className="text-right px-3 py-2 font-medium">{t('ads.remainingCount')}</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-white/[0.06]">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-3 py-2">
                <p className="font-medium dark:text-white">{taskName(task, i18n.language)}</p>
                {task.scope && (
                  <p className="text-xs text-slate-500">
                    {t(`ads.scope_${task.scope}`)}
                    {task.scope === 'selected' && ` · ${t('ads.selectedCount', { count: task.target_ids?.length ?? 0 })}`}
                  </p>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                {fmtTmt(task.price)} <span className="text-xs text-slate-500">({task.ball} {t('ads.ball').toLowerCase()})</span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{task.limit ?? t('ads.noLimit')}</td>
              <td className="px-3 py-2 text-right tabular-nums">{task.done_count}</td>
              <td className="px-3 py-2 text-right tabular-nums">{task.pending_count}</td>
              <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{fmtTmt(task.spent)}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">{task.remaining_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
