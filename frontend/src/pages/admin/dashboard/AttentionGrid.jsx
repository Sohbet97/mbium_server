import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Package, Clapperboard, ClipboardList, Tag, FileCheck, CreditCard, LayoutTemplate, CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// key = field from GET /admin/pending-counts (only present when the caller may see it)
const ITEMS = [
  { key: 'products',         labelKey: 'dashboard.aProducts',  icon: Package,        to: '/admin/catalog/products' },
  { key: 'reels',            labelKey: 'dashboard.aReels',     icon: Clapperboard,   to: '/admin/catalog/reels' },
  { key: 'shopApplications', labelKey: 'dashboard.aShopApps',  icon: ClipboardList,  to: '/admin/shop-applications' },
  { key: 'shopTypeRequests', labelKey: 'dashboard.aShopTypes', icon: Tag,            to: '/admin/shop-type-requests' },
  { key: 'kyc',              labelKey: 'dashboard.aKyc',       icon: FileCheck,      to: '/admin/kyc' },
  { key: 'payoutRequests',   labelKey: 'dashboard.aPayouts',   icon: CreditCard,     to: '/admin/payouts' },
  { key: 'banners',          labelKey: 'dashboard.aBanners',   icon: LayoutTemplate, to: '/admin/banners' },
]

export default function AttentionGrid({ counts }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const visible = ITEMS.filter((i) => counts?.[i.key] !== undefined)
  if (visible.length === 0) return null

  const pending = visible.filter((i) => counts[i.key] > 0)
  const total = pending.reduce((s, i) => s + counts[i.key], 0)

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('dashboard.needsAttention')}</h3>
        {total > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">{total}</span>
        )}
      </div>

      {pending.length === 0 ? (
        <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm text-emerald-800 dark:text-emerald-300">{t('dashboard.allClear')}</span>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {pending.map(({ key, labelKey, icon: Icon, to }) => (
            <Card
              key={key}
              onClick={() => navigate(to)}
              className={cn(
                'flex cursor-pointer items-center gap-3 p-3 transition-all hover:shadow-md',
                'border-red-200/70 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/[0.06]',
              )}
            >
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-500/15">
                <Icon className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none text-slate-900 dark:text-white tabular-nums">{counts[key]}</p>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-[#a0a0ab]">{t(labelKey)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
