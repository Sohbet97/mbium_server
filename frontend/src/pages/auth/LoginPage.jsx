import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/store/auth'
import { AuthApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, EyeOff, AlertCircle, Globe, ArrowLeft } from 'lucide-react'
import { ThemeSwitcher } from '../../components/layout/TopBar'

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'tk', flag: '🇹🇲' },
  { code: 'ru', flag: '🇷🇺' },
]

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function LoginPage() {
  const { login, verifyOtp: verifyOtpAuth, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [step, setStep] = useState('credentials') // 'credentials' | 'otp'
  const [form, setForm] = useState({ phone_number: '', password: '' })
  const [otp, setOtp] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const googleBtnRef = useRef(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    function initGoogle() {
      if (!window.google) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError('')
          setLoading(true)
          try {
            await loginWithGoogle(credential)
            navigate('/admin')
          } catch (err) {
            setError(err.response?.data?.message ?? t('login.error'))
          } finally {
            setLoading(false)
          }
        },
      })
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 340,
          logo_alignment: 'center',
        })
      }
    }

    if (window.google) {
      initGoogle()
    } else if (!document.getElementById('gsi-script')) {
      const script = document.createElement('script')
      script.id = 'gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGoogle
      document.head.appendChild(script)
    }
  }, [loginWithGoogle, navigate, t])

  async function handleCredentialSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.phone_number, form.password)
      if (result.is2FA) {
        setSessionId(result.session_id)
        setStep('otp')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message ?? t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOtpAuth(sessionId, otp)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message ?? t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    try {
      await AuthApi.resendOtp({ session_id: sessionId })
    } catch (err) {
      setError(err.response?.data?.message ?? t('login.error'))
    } finally {
      setResending(false)
    }
  }

  function goBack() {
    setStep('credentials')
    setOtp('')
    setError('')
  }

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <div className={"min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#232727] bg-[#f6f6f7]"}>
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-600 bg-white dark:bg-[#0e0e0e] dark:text-white border hover:bg-slate-50 transition-colors">
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
                className={i18n.language === code ? 'bg-slate-100 font-medium dark:bg-[#010101]' : ''}
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
          <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">mbium</span>
          <p className="text-sm text-slate-500 mt-1">{t('login.subtitle')}</p>
        </div>

        <Card>
          {step === 'credentials' ? (
            <>
              <CardHeader>
                <CardTitle className="text-xl ">{t('login.title')}</CardTitle>
                <CardDescription>{t('login.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleCredentialSubmit} className="space-y-4">
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

                {GOOGLE_CLIENT_ID && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-card px-2 text-slate-400">{t('login.orContinueWith')}</span>
                      </div>
                    </div>
                    <div ref={googleBtnRef} className="flex justify-center" />
                  </>
                )}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goBack}
                    className="text-slate-400 hover:text-slate-600 -ml-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <CardTitle className="text-xl">{t('login.otpTitle')}</CardTitle>
                </div>
                <CardDescription>{t('login.otpDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="otp">{t('login.otpLabel')}</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder={t('login.otpPlaceholder')}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                    {loading ? t('login.otpSubmitting') : t('login.otpSubmit')}
                  </Button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  >
                    {resending ? t('login.otpResending') : t('login.otpResend')}
                  </button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
