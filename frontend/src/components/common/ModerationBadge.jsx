import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { MOD } from '@/lib/moderation'

// `tPrefix` lets each resource keep its own translation keys (e.g. 'products'
// preserves the original product-page strings) while sharing this component.
export function ModerationBadge({ status, tPrefix = 'products' }) {
  const { t } = useTranslation()
  if (status === MOD.APPROVED) return <Badge variant="success">{t(`${tPrefix}.modStatusApproved`, 'Approved')}</Badge>
  if (status === MOD.REJECTED) return <Badge variant="destructive">{t(`${tPrefix}.modStatusRejected`, 'Rejected')}</Badge>
  return <Badge variant="warning">{t(`${tPrefix}.modStatusPending`, 'Pending')}</Badge>
}
