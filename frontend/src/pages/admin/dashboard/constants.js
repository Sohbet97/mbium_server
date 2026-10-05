// Order status meta shared by the dashboard widgets. `hex` is used by charts, `badge` by pills.
export const ORDER_STATUS_META = {
  0:  { labelKey: 'orders.statusPending',    hex: '#f59e0b', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  1:  { labelKey: 'orders.statusConfirmed',  hex: '#3b82f6', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
  2:  { labelKey: 'orders.statusProcessing', hex: '#8b5cf6', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300' },
  3:  { labelKey: 'orders.statusShipped',    hex: '#6366f1', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300' },
  4:  { labelKey: 'orders.statusDelivered',  hex: '#10b981', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  5:  { labelKey: 'dashboard.statusClosed',  hex: '#22c55e', badge: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' },
  10: { labelKey: 'orders.statusCancelled',  hex: '#ef4444', badge: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' },
  11: { labelKey: 'orders.statusRefunded',   hex: '#94a3b8', badge: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300' },
}
export const FALLBACK_STATUS = { labelKey: 'common.status', hex: '#cbd5e1', badge: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' }
export const statusMeta = (s) => ORDER_STATUS_META[s] ?? FALLBACK_STATUS

export const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(n ?? 0))
export const fmtInt = (n) => new Intl.NumberFormat().format(Number(n ?? 0))
