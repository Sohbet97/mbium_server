import { useTranslation } from 'react-i18next'

export default function PlaceholderPage({ titleKey }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <div className="text-4xl mb-3">🚧</div>
      <p className="text-sm font-medium">{t(titleKey)} — {t('common.comingSoon')}</p>
    </div>
  )
}
