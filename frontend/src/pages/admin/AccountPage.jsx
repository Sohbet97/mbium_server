import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Monitor, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AuthApi } from '@/lib/api'
import { useAuth } from '@/store/auth'

// ── Design tokens ─────────────────────────────────────────────────────────────
const SHOPIFY_GREEN = '#008060'

// ── Primitives ────────────────────────────────────────────────────────────────

/** White card with border + shadow — matches Shopify card style */
function SCard({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-[#111114] rounded-lg border border-slate-200 dark:border-white/[0.06] shadow-sm ${className}`}>
      {children}
    </div>
  )
}


const GoogleLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

/** Section row: label/desc on left, card on right, separated by full-width divider */
function SectionRow({ label, description, children, last = false }) {
  return (
    <>
      <div className="flex gap-8 py-8">
        <div className="w-56 shrink-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      {!last && <hr className="border-slate-200 dark:border-white/[0.06]" />}
    </>
  )
}

// ── Inline edit helpers ───────────────────────────────────────────────────────

function InlineEdit({ value, type = 'text', onSave, onCancel, maxLength, placeholder, hint }) {
  const { t } = useTranslation()
  const [val, setVal] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try { await onSave(val) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave} className="mt-1.5 space-y-2">
      <Input type={type} value={val} onChange={(e) => setVal(e.target.value)}
        maxLength={maxLength} placeholder={placeholder} autoFocus />
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={saving} className="h-8 text-xs">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : t('account.saveProfile')}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}

// ── General page ──────────────────────────────────────────────────────────────

function GeneralSection({ profile, onProfileSaved }) {
  const { t } = useTranslation()
  const [nameForm, setNameForm] = useState({ name: profile?.name ?? '', surname: profile?.surname ?? '' })
  const [savingName, setSavingName] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const initials = [profile?.name?.[0], profile?.surname?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  async function handleSaveName(e) {
    e.preventDefault()
    setSavingName(true)
    try {
      const { data } = await AuthApi.updateMe(nameForm)
      onProfileSaved(data.model)
      toast.success(t('toast.saved'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setSavingName(false)
    }
  }

  async function handleSaveEmail(val) {
    const { data } = await AuthApi.updateMe({ email: val })
    onProfileSaved(data.model)
    setEditingEmail(false)
    toast.success(t('toast.saved'))
  }

  async function handleSavePhone(val) {
    const { data } = await AuthApi.updateMe({ phone_number: val })
    onProfileSaved(data.model)
    setEditingPhone(false)
    toast.success(t('toast.saved'))
  }

  async function handleDisconnectGoogle() {
    if (!window.confirm(t('account.disconnectConfirm'))) return
    setDisconnecting(true)
    try {
      await AuthApi.disconnectGoogle()
      onProfileSaved({ ...profile, google_id: null })
      toast.success(t('account.googleDisconnected'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await AuthApi.uploadAvatar(formData)
      onProfileSaved({ ...profile, thumbnail: data.thumbnail })
      toast.success(t('toast.saved'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      {/* ── Data ── */}
      <SectionRow label={t('account.sectionData')}>
        <SCard>
          {/* Avatar row */}
          <div className="px-5 py-4 flex items-center gap-4 border-b border-slate-100 dark:border-white/[0.06]">
            <Avatar className="h-12 w-12">
              {profile?.thumbnail && <AvatarImage src={profile.thumbnail} alt={initials} />}
              <AvatarFallback className="text-white text-base font-semibold"
                style={{ background: SHOPIFY_GREEN }}>{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="cursor-pointer flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {uploading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Camera className="h-3.5 w-3.5" />}
              {t('account.uploadPhoto')}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name + Surname inputs */}
          <form onSubmit={handleSaveName}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 dark:text-slate-400">{t('account.name')}</Label>
                  <Input value={nameForm.name} onChange={(e) => setNameForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 dark:text-slate-400">{t('users.surname')}</Label>
                  <Input value={nameForm.surname} onChange={(e) => setNameForm(f => ({ ...f, surname: e.target.value }))} />
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('account.nameHint')}</p>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={savingName} className="h-8 text-xs">
                  {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : t('account.saveProfile')}
                </Button>
              </div>
            </div>
          </form>

          {/* Email */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('users.email')}</p>
            {editingEmail ? (
              <InlineEdit value={profile?.email} type="email" onSave={handleSaveEmail}
                onCancel={() => setEditingEmail(false)} />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {profile?.email ? (
                    <>
                      <span className="text-sm text-slate-800 dark:text-white truncate">{profile.email}</span>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t('account.verified')}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500">{t('account.noEmail')}</span>
                  )}
                </div>
                <button className="text-sm font-medium shrink-0" style={{ color: SHOPIFY_GREEN }}
                  onClick={() => setEditingEmail(true)}>
                  {profile?.email ? t('account.update') : t('account.add')}
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="px-5 py-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
              {t('users.phone')} <span className="text-slate-400 dark:text-slate-500">({t('common.optional')})</span>
            </p>
            {editingPhone ? (
              <InlineEdit value={profile?.phone_number} type="tel" maxLength={8}
                placeholder="61XXXXXX" hint={t('login.phoneHint')}
                onSave={handleSavePhone} onCancel={() => setEditingPhone(false)} />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm ${profile?.phone_number ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {profile?.phone_number || t('account.noPhone')}
                </span>
                <button className="text-sm font-medium shrink-0" style={{ color: SHOPIFY_GREEN }}
                  onClick={() => setEditingPhone(true)}>
                  {profile?.phone_number ? t('account.update') : t('account.add')}
                </button>
              </div>
            )}
          </div>
        </SCard>
      </SectionRow>

      {/* ── Login services ── */}
      <SectionRow label={t('account.loginServices')} description={t('account.loginServicesDesc')} last>
        <SCard>
          <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <GoogleLogo />
              <span className="text-sm text-slate-800 dark:text-white">{t('account.googleCanLogin')}</span>
            </div>
            {profile?.google_id ? (
              <button className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors shrink-0"
                onClick={handleDisconnectGoogle} disabled={disconnecting}>
                {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : t('account.googleDisconnect')}
              </button>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">{t('account.googleNotConnected')}</span>
            )}
          </div>
          {profile?.google_id && profile?.email && (
            <div className="px-5 py-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('account.googleConnectedTo')}{' '}
                <a href={`mailto:${profile.email}`} className="font-medium hover:underline inline-flex items-center gap-0.5"
                  style={{ color: SHOPIFY_GREEN }}>
                  {profile.email}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          )}
        </SCard>
      </SectionRow>
    </>
  )
}

// ── Security page ─────────────────────────────────────────────────────────────

function SecuritySection({ profile }) {
  const { t } = useTranslation()
  const [pwForm, setPwForm] = useState({ old_password: '', password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState(null)

  const isGoogleOnly = !!profile?.google_id && !profile?.password
  const setpw = (key) => (e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))

  useEffect(() => {
    AuthApi.getSessions()
      .then(({ data }) => setSessions(data.data ?? []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false))
  }, [])

  async function handleChangePassword(e) {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) { toast.error(t('account.passwordMismatch')); return }
    setPwSaving(true)
    try {
      await AuthApi.changePassword({ old_password: pwForm.old_password, password: pwForm.password })
      setPwForm({ old_password: '', password: '', confirm: '' })
      toast.success(t('toast.saved'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setPwSaving(false)
    }
  }

  async function handleRevokeSession(id) {
    setRevokingId(id)
    try {
      await AuthApi.deleteSession(id)
      setSessions((s) => s.filter((x) => x.id !== id))
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setRevokingId(null)
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleString() : ''

  return (
    <>
      {/* ── Password ── */}
      <SectionRow label={t('account.passwordTitle')} description={t('account.passwordDesc')}>
        <SCard>
          {isGoogleOnly ? (
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('account.noPassword')}</p>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="px-5 py-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 dark:text-slate-400">{t('account.oldPassword')}</Label>
                <Input type="password" value={pwForm.old_password} onChange={setpw('old_password')} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 dark:text-slate-400">{t('account.newPassword')}</Label>
                <Input type="password" value={pwForm.password} onChange={setpw('password')} required minLength={8} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 dark:text-slate-400">{t('account.confirmPassword')}</Label>
                <Input type="password" value={pwForm.confirm} onChange={setpw('confirm')} required />
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" disabled={pwSaving} className="h-8 text-xs">
                  {pwSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : t('account.changePassword')}
                </Button>
              </div>
            </form>
          )}
        </SCard>
      </SectionRow>

      {/* ── Devices ── */}
      <SectionRow label={t('account.sessionsTitle')} description={t('account.sessionsDesc')} last>
        <SCard>
          <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06]">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('account.signedIn')}</p>
          </div>
          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 px-5 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-4">{t('account.noSessions')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {sessions.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Monitor className="h-5 w-5 mt-0.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                          {s.device_info || t('account.unknownDevice')}
                        </p>
                        {i === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {t('account.thisDevice')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {s.ip} · {fmt(s.last_used)}
                      </p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-slate-500 hover:text-red-600 shrink-0 transition-colors"
                    onClick={() => handleRevokeSession(s.id)} disabled={revokingId === s.id}>
                    {revokingId === s.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : t('account.sessionLogout')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SCard>
      </SectionRow>
    </>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────

const NAV = ['general', 'security']

export default function AccountPage() {
  const { t } = useTranslation()
  const { updateUser } = useAuth()
  const [active, setActive] = useState('general')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AuthApi.me()
      .then(({ data }) => setProfile(data.model))
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [])

  function handleProfileSaved(updated) {
    setProfile(updated)
    updateUser({ name: updated.name, surname: updated.surname })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="flex gap-10 max-w-5xl">
      {/* ── Left sidebar ── */}
      <aside className="w-48 shrink-0 border-r border-slate-200 dark:border-white/[0.06]">
        <nav className="flex flex-col">
          {NAV.map((key) => {
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={[
                  'text-left text-sm py-2 pl-4 transition-colors border-l-[3px]',
                  isActive
                    ? 'font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08]'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20',
                ].join(' ')}
                style={isActive ? { borderLeftColor: SHOPIFY_GREEN } : {}}
              >
                {t(`account.tab${key.charAt(0).toUpperCase() + key.slice(1)}`)}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Right content ── */}
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
          {t(`account.tab${active.charAt(0).toUpperCase() + active.slice(1)}`)}
        </h2>

        {active === 'general' && (
          <GeneralSection profile={profile} onProfileSaved={handleProfileSaved} />
        )}
        {active === 'security' && (
          <SecuritySection profile={profile} />
        )}
      </div>
    </div>
  )
}
