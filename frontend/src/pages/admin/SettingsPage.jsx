import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { t } = useTranslation()

  const [otpEnabled, setOtpEnabled] = useState(false)
  const [commissionPct, setCommissionPct] = useState('') // displayed as %
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    AdminApi.config.get()
      .then(({ data }) => {
        if (cancelled) return
        const m = data?.model ?? data?.data ?? {}
        setOtpEnabled(!!m.is_otp_enabled)
        const rate = m.platform_commission_rate
        setCommissionPct(rate != null ? String(parseFloat((rate * 100).toFixed(4))) : '0')
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function handleSave() {
    const pct = parseFloat(commissionPct)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError('Commission rate must be between 0 and 100.')
      return
    }
    setError('')
    setSaving(true)
    setSavedMsg('')
    AdminApi.config.update({
      is_otp_enabled: otpEnabled,
      platform_commission_rate: pct / 100,
    })
      .then(() => { toast.success(t('toast.saved')); setSavedMsg('') })
      .catch((e) => { toast.error(e.response?.data?.message ?? t('toast.error')) })
      .finally(() => setSaving(false))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-slate-500" />
        <h2 className="text-xl font-semibold text-slate-900">{t('settings.title')}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.platformConfig')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* OTP toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">{t('settings.otpEnabled')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('settings.otpEnabledDesc')}</p>
            </div>
            <Switch
              checked={otpEnabled}
              onCheckedChange={setOtpEnabled}
            />
          </div>

          <hr className="border-slate-100" />

          {/* Commission rate */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">
              {t('settings.commissionRate')}
            </label>
            <p className="text-xs text-slate-500">{t('settings.commissionRateDesc')}</p>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>

          {/* Feedback */}
          {savedMsg && (
            <p className="text-sm text-emerald-600 font-medium">{savedMsg}</p>
          )}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? t('settings.saving') : t('settings.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
