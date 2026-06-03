import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { AuthApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Store, AlertCircle, Upload, CheckCircle2, FileText, Video, FileImage } from 'lucide-react'
import { toast } from 'sonner'

// Styled file picker that shows current/selected filename
function FileField({ label, name, accept, icon: Icon, currentPath, onChange }) {
  const ref = useRef(null)
  const [file, setFile] = useState(null)
  const existingName = currentPath ? currentPath.split('/').pop() : null
  const displayName  = file?.name ?? existingName

  function handle(e) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    onChange(name, f)
  }

  return (
    <div className="space-y-1.5">
      <Label className="mb-1 block">{label}</Label>
      <div
        className="flex items-center gap-2 h-9 border rounded-md px-3 bg-white dark:bg-slate-900 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        onClick={() => ref.current?.click()}
      >
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <span className={`text-sm truncate flex-1 ${displayName ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
          {displayName ?? 'Faýl saýlaň…'}
        </span>
        {displayName
          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          : <Upload className="h-4 w-4 text-slate-300 shrink-0" />
        }
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handle} />
    </div>
  )
}

const EMPTY_TEXT = {
  type_id: '', name: '', name_ru: '', description: '',
  phone: '', email: '', address: '', bank_iban: '',
}

export default function ShopApplyPage() {
  const { user, updateUser, setUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [shopTypes, setShopTypes]       = useState([])
  const [text, setText]                 = useState(EMPTY_TEXT)
  const [files, setFiles]               = useState({ passport_file: null, patent_file: null, video_url: null })
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [typesLoading, setTypesLoading] = useState(true)
  const [tokenLoading, setTokenLoading] = useState(!!searchParams.get('token'))

  // Exchange one-time deep-link token from mobile app
  useEffect(() => {
    const webToken = searchParams.get('token')
    if (!webToken) return

    AuthApi.consumeWebToken(webToken)
      .then(async ({ data }) => {
        localStorage.setItem('accessToken', data.token)
        const { data: profileData } = await AuthApi.me()
        setUser(profileData.model ?? null)
        // Remove token from URL so refresh doesn't re-consume it
        setSearchParams({}, { replace: true })
      })
      .catch(() => setError('Baglanyşyk nädogry ýa-da möhleti geçen. Täzeden synanyşyň.'))
      .finally(() => setTokenLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isReApply = user?.shop?.verification_status === 3

  useEffect(() => {
    const vs = user?.shop?.verification_status
    if (vs === 1 || vs === 2) navigate('/pending', { replace: true })

    if (vs === 3 && user?.shop) {
      const s = user.shop
      setText({
        type_id:     s.type_id     ?? '',
        name:        s.name        ?? '',
        name_ru:     s.name_ru     ?? '',
        description: s.description ?? '',
        phone:       s.phone       ?? '',
        email:       s.email       ?? '',
        address:     s.address     ?? '',
        bank_iban:   s.bank_iban   ?? '',
      })
    }
  }, [user, navigate])

  useEffect(() => {
    AuthApi.getShopTypes({ limit: 100 })
      .then(({ data }) => setShopTypes(data.data ?? []))
      .catch(() => {})
      .finally(() => setTypesLoading(false))
  }, [])

  function setFile(name, file) {
    setFiles((f) => ({ ...f, [name]: file }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!text.type_id)    { setError('Dükan görnüşini saýlaň'); return }
    if (!text.name.trim()) { setError('Dükan adyny giriziň');   return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('type_id', text.type_id)
      fd.append('name',    text.name.trim())
      if (text.name_ru.trim())     fd.append('name_ru',     text.name_ru.trim())
      if (text.description.trim()) fd.append('description', text.description.trim())
      if (text.phone.trim())       fd.append('phone',       text.phone.trim())
      if (text.email.trim())       fd.append('email',       text.email.trim())
      if (text.address.trim())     fd.append('address',     text.address.trim())
      if (text.bank_iban.trim())   fd.append('bank_iban',   text.bank_iban.trim())

      if (files.passport_file) fd.append('passport_file', files.passport_file)
      if (files.patent_file)   fd.append('patent_file',   files.patent_file)
      if (files.video_url)     fd.append('video_url',     files.video_url)

      const { data } = await AuthApi.applyForShop(fd)
      updateUser({ shop: data.model })
      toast.success('Arza ugradyldy!')
      navigate('/pending', { replace: true })
    } catch (err) {
      const msg  = err.response?.data?.message
      const errs = err.response?.data?.errors
      setError(errs ? Object.values(errs).join(', ') : (msg ?? 'Ýalňyşlyk boldy. Gaýtadan synanyşyň.'))
    } finally {
      setLoading(false)
    }
  }

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-[#1a1f2e] dark:via-[#232727] dark:to-[#1f2937]">
        <div className="text-center space-y-3">
          <Store className="h-10 w-10 text-blue-500 mx-auto animate-pulse" />
          <p className="text-slate-600 dark:text-slate-300 text-sm">Baglanyşyk barlanýar…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-[#1a1f2e] dark:via-[#232727] dark:to-[#1f2937] px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pending')} className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isReApply ? 'Arzany täzeden iber' : 'Dükan açmak üçin arza'}
            </h1>
            <p className="text-sm text-slate-500">
              {isReApply ? 'Maglumatlary düzediň we täzeden ugradyň' : 'Maglumatlary dolduryň we moderasiýa ugradyň'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Basic info ─────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#111114] rounded-2xl p-5 shadow-sm border dark:border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white">
              <Store className="h-4 w-4 text-blue-500" />
              Dükan maglumatlary
            </div>

            <div>
              <Label className="mb-1 block">Dükan görnüşi <span className="text-red-500">*</span></Label>
              {typesLoading ? (
                <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
              ) : (
                <select
                  value={text.type_id}
                  onChange={(e) => setText((f) => ({ ...f, type_id: e.target.value }))}
                  className="w-full h-9 border rounded-md px-3 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">— Saýlaň —</option>
                  {shopTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Dükan ady (TM) <span className="text-red-500">*</span></Label>
                <Input value={text.name} onChange={(e) => setText((f) => ({ ...f, name: e.target.value }))} placeholder="Dükan ady" required />
              </div>
              <div>
                <Label className="mb-1 block">Dükan ady (RU)</Label>
                <Input value={text.name_ru} onChange={(e) => setText((f) => ({ ...f, name_ru: e.target.value }))} placeholder="Название магазина" />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Beýany</Label>
              <Textarea
                value={text.description}
                onChange={(e) => setText((f) => ({ ...f, description: e.target.value }))}
                placeholder="Dükan barada gysgaça maglumat…"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Telefon</Label>
                <Input value={text.phone} onChange={(e) => setText((f) => ({ ...f, phone: e.target.value }))} placeholder="6XXXXXXX" />
              </div>
              <div>
                <Label className="mb-1 block">E-mail</Label>
                <Input type="email" value={text.email} onChange={(e) => setText((f) => ({ ...f, email: e.target.value }))} placeholder="shop@example.com" />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Adres</Label>
              <Input value={text.address} onChange={(e) => setText((f) => ({ ...f, address: e.target.value }))} placeholder="Şäher, köçe, jaý" />
            </div>
          </section>

          {/* ── KYC documents ──────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#111114] rounded-2xl p-5 shadow-sm border dark:border-white/[0.06] space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-white">Resminamalar (islege görä)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Patent we bank IBAN bolan dükanlara{' '}
                <span className="font-medium text-purple-600">Verified PRO</span> derejesi berilýär.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileField
                label="Passport / Şahadatnama"
                name="passport_file"
                accept="image/*,application/pdf"
                icon={FileImage}
                currentPath={user?.shop?.passport_file}
                onChange={setFile}
              />
              <FileField
                label="Patent faýly"
                name="patent_file"
                accept="image/*,application/pdf"
                icon={FileText}
                currentPath={user?.shop?.patent_file}
                onChange={setFile}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Bank IBAN</Label>
                <Input
                  value={text.bank_iban}
                  onChange={(e) => setText((f) => ({ ...f, bank_iban: e.target.value }))}
                  placeholder="TM…"
                  maxLength={34}
                  className="font-mono text-sm"
                />
              </div>
              <FileField
                label="Tanyşdyryş wideo"
                name="video_url"
                accept="video/mp4,video/quicktime,video/webm"
                icon={Video}
                currentPath={user?.shop?.video_url}
                onChange={setFile}
              />
            </div>
          </section>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Ugradylýar…' : isReApply ? 'Täzeden ugrat' : 'Arzany ugrat'}
          </Button>

        </form>
      </div>
    </div>
  )
}
