import { BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// Plan-driven verification mark — distinct from the text "Verified" Badge,
// which reflects KYC (`shop.is_verified`) rather than a plan grant.
export function BlueBadge({ show, className, size = 14 }) {
  const { t } = useTranslation()
  if (!show) return null
  return (
    <BadgeCheck
      className={cn('inline text-blue-500 shrink-0', className)}
      style={{ width: size, height: size }}
      fill="currentColor"
      stroke="white"
      aria-label={t('common.blueBadge', 'Verified shop')}
    />
  )
}
