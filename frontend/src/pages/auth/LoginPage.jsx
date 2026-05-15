import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, EyeOff, AlertCircle, Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'tk', flag: '🇹🇲' },
  { code: 'ru', flag: '🇷🇺' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState({ phone_number: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.phone_number, form.password)
      if (result.is2FA) {
        // OTP is enabled — for now show a message; OTP screen can be added later
        setError(`OTP sent. session_id: ${result.session_id}`)
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message ?? t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      {/* Language picker top-right */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-600 bg-white border hover:bg-slate-50 transition-colors">
              <Globe className="h-4 w-4" />
              <span>{current.flag}</span>
              <span>{t(`lang.${current.code}`)}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LANGUAGES.map(({ code, flag }) => (
              <DropdownMenuItem
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                className={i18n.language === code ? 'bg-slate-100 font-medium' : ''}
              >
                <span className="mr-2">{flag}</span>
                {t(`lang.${code}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold tracking-tight text-slate-900">mbium</span>
          <p className="text-sm text-slate-500 mt-1">{t('login.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('login.title')}</CardTitle>
            <CardDescription>{t('login.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone">{t('login.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('login.phonePlaceholder')}
                  maxLength={8}
                  value={form.phone_number}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                  required
                />
                <p className="text-xs text-slate-400">{t('login.phoneHint')}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder={t('login.passwordPlaceholder')}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
