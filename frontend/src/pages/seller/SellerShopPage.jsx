import { useEffect, useMemo, useRef, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Camera, FileText, Upload, CheckCircle2, Clock, XCircle, Star, CreditCard, Video, FileImage, Loader2, Tag, RefreshCw, ChevronDown, ChevronRight, LayoutGrid, List, Eye, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function imgUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${BASE}${path}`
}

const TIER = {
  0: { label: 'Garaşylýar',   className: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
  1: { label: 'Standard',     className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  2: { label: 'Verified PRO', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
}

const VS = {
  0: { icon: Clock,         label: 'Barlanmadyk',   className: 'text-slate-400' },
  1: { icon: Clock,         label: 'Garaşylýar',    className: 'text-amber-500' },
  2: { icon: CheckCircle2,  label: 'Tassyklanan',   className: 'text-green-500' },
  3: { icon: XCircle,       label: 'Ret edildi',    className: 'text-red-500' },
}

// ── Logo upload area ──────────────────────────────────────────────────────────
function LogoUpload({ logoUrl, onUploaded }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const { data } = await SellerApi.shop.uploadLogo(fd)
      onUploaded(data.model)
      toast.success(t('seller.logoUploaded'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div
      className="relative group w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-hidden cursor-pointer shrink-0"
      onClick={() => inputRef.current?.click()}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="logo" className="w-full h-full object-cover" crossOrigin=''/>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-white/20 gap-1">
          <Camera className="h-7 w-7" />
          <span className="text-[10px]">Logo</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading
          ? <Loader2 className="h-5 w-5 text-white animate-spin" />
          : <Camera className="h-5 w-5 text-white" />
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── File viewer ───────────────────────────────────────────────────────────────
function fileViewType(path) {
  if (!path) return null
  const ext = path.split('?')[0].toLowerCase().split('.').pop()
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video'
  return 'other'
}

function FileViewerDialog({ open, onOpenChange, url, label }) {
  const type = fileViewType(url)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base">{label}</DialogTitle>
        </DialogHeader>
        <div className="p-5 space-y-3">
          {type === 'image' && (
            <div className="flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl overflow-hidden min-h-[200px]">
              <img src={url} alt={label} className="max-h-[70vh] max-w-full object-contain" />
            </div>
          )}
          {type === 'pdf' && (
            <iframe
              src={url}
              className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-white/10"
              title={label}
            />
          )}
          {type === 'video' && (
            <video
              src={url}
              controls
              className="w-full rounded-xl bg-black max-h-[70vh]"
            />
          )}
          {type === 'other' && (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <FileText className="h-8 w-8 opacity-40" />
              <p className="text-sm">Görnüş elýeterli däl</p>
            </div>
          )}
          <div className="flex justify-end">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Täze goýagçda aç
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Single document upload row ────────────────────────────────────────────────
function DocRow({ icon: Icon, label, fieldName, currentPath, onUploaded, accept = '*' }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [viewing, setViewing] = useState(false)
  const filename = currentPath ? currentPath.split('/').pop() : null
  const fileUrl  = currentPath ? imgUrl(currentPath) : null

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append(fieldName, file)
      const { data } = await SellerApi.shop.uploadDocs(fd)
      onUploaded(data.model)
      toast.success(t('seller.docUploaded', { name: label }))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 py-3 border-b last:border-0 dark:border-white/[0.06]">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-white">{label}</p>
          {filename ? (
            <p className="text-xs text-green-600 dark:text-green-400 truncate flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="h-3 w-3 shrink-0" /> {filename}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">Faýl ýok</p>
          )}
        </div>
        {fileUrl && (
          <button
            type="button"
            onClick={() => setViewing(true)}
            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Görmek
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Upload className="h-3.5 w-3.5" />
          }
          {uploading ? t('common.loading') : t('media.upload')}
        </button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      </div>
      {fileUrl && (
        <FileViewerDialog
          open={viewing}
          onOpenChange={setViewing}
          url={fileUrl}
          label={label}
        />
      )}
    </>
  )
}

// ── Shop type change request section ─────────────────────────────────────────
function ShopTypeSection({ shop }) {
  const { t } = useTranslation()
  const [types, setTypes]           = useState([])
  const [request, setRequest]       = useState(undefined) // undefined = loading, null = none
  const [loadError, setLoadError]   = useState(false)
  const [open, setOpen]             = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoadError(false)
    Promise.all([
      SellerApi.shop.getTypes(),
      SellerApi.shop.getTypeChangeRequest(),
    ]).then(([typesRes, reqRes]) => {
      setTypes(typesRes.data.data ?? [])
      setRequest(reqRes.data.model ?? null)
    }).catch(() => {
      setRequest(null)
      setLoadError(true)
    })
  }, [])

  async function handleSubmit() {
    if (!selectedTypeId) return
    setSubmitting(true)
    try {
      await SellerApi.shop.createTypeChangeRequest({ requested_type_id: selectedTypeId })
      // Re-fetch so the response includes the requestedType association
      const { data } = await SellerApi.shop.getTypeChangeRequest()
      setRequest(data.model ?? null)
      setOpen(false)
      setSelectedTypeId(null)
      toast.success(t('seller.shopTypeRequestSent'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setOpen(false)
    setSelectedTypeId(null)
  }

  const loading        = request === undefined
  const hasPending     = request?.status === 0
  const currentTypeName = shop?.type?.name ?? (shop?.type_id ? `#${shop.type_id}` : '—')

  const REQ_STATUS = {
    0: { label: t('seller.shopTypeRequestPending'),  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    1: { label: t('seller.shopTypeRequestApproved'), className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    2: { label: t('seller.shopTypeRequestRejected'), className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400" />
          {t('seller.shopTypeTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current type */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t('seller.shopTypeCurrent')}</p>
            <span className="text-sm font-medium text-slate-800 dark:text-white">{currentTypeName}</span>
          </div>
          {/* Only render the button once loading is resolved and no pending request */}
          {!loading && !hasPending && !loadError && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('seller.shopTypeChange')}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
            </button>
          )}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>

        {/* Error state */}
        {loadError && (
          <p className="text-xs text-red-500">{t('toast.error')}</p>
        )}

        {/* Latest request status badge */}
        {!loading && request !== null && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', REQ_STATUS[request.status]?.className)}>
              {REQ_STATUS[request.status]?.label}
            </span>
            {request.requestedType && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                → {request.requestedType.name}
              </span>
            )}
            {request.status === 2 && request.note && (
              <span className="text-xs text-red-500 italic">"{request.note}"</span>
            )}
          </div>
        )}

        {/* Type picker (collapsible) */}
        {open && !hasPending && (
          <div className="border dark:border-white/[0.06] rounded-xl p-3 space-y-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('seller.shopTypeSelectNew')}</p>
            <div className="grid grid-cols-2 gap-2">
              {types
                .filter((ty) => ty.id !== shop?.type_id)
                .map((ty) => (
                  <button
                    type="button"
                    key={ty.id}
                    onClick={() => setSelectedTypeId(ty.id)}
                    className={cn(
                      'text-left text-sm px-3 py-2 rounded-lg border transition-colors',
                      selectedTypeId === ty.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    {ty.name}
                    {ty.name_ru && <span className="block text-xs text-slate-400">{ty.name_ru}</span>}
                  </button>
                ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                {t('common.cancel')}
              </Button>
              <Button type="button" size="sm" disabled={!selectedTypeId || submitting} onClick={handleSubmit}>
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                {t('common.send')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerShopPage() {
  const { t } = useTranslation()
  const [shop, setShop]                       = useState(null)
  const [form, setForm]                       = useState({})
  const [ibanForm, setIbanForm]               = useState({ bank_iban: '', card_number: '' })
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [savingIban, setSavingIban]           = useState(false)
  const [allCategories, setAllCategories]     = useState([])
  const [selectedCatIds, setSelectedCatIds]   = useState([])
  const [savingCats, setSavingCats]           = useState(false)
  const [catView, setCatView]                 = useState('tree') // 'grid' | 'tree'

  const fetchCategories = ()=>{
    SellerApi.categories.getAll()
      .then(({ data }) => {
        setAllCategories(data.data ?? [])
      })
      .catch(() => {})
  }
  useEffect(fetchCategories, [])

  useEffect(() => {
    SellerApi.shop.get()
      .then(({ data }) => {
        const s = data.model
        setShop(s)
        setForm({
          name:           s.name           ?? '',
          name_ru:        s.name_ru        ?? '',
          name_eng:       s.name_eng       ?? '',
          description:    s.description    ?? '',
          description_tm: s.description_tm ?? '',
          description_ru: s.description_ru ?? '',
          description_en: s.description_en ?? '',
          phone:          s.phone          ?? '',
          email:          s.email          ?? '',
          address:        s.address        ?? '',
        })
        setIbanForm({
          bank_iban:   s.bank_iban   ?? '',
          card_number: s.card_number ?? '',
        })
        setSelectedCatIds((s.categories ?? []).map((c) => c.id))
      })
      .finally(() => setLoading(false))
  }, [])

  const field = (key, setter = setForm) => ({
    value: (key === 'bank_iban' || key === 'card_number' ? ibanForm : form)[key] ?? '',
    onChange: (e) => setter((f) => ({ ...f, [key]: e.target.value })),
  })

  async function handleSaveInfo(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await SellerApi.shop.update(form)
      setShop(data.model)
      toast.success(t('toast.saved'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setSaving(false)
    }
  }

  function toggleCat(id) {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function bulkToggleCat(ids, checked) {
    setSelectedCatIds((prev) =>
      checked
        ? [...new Set([...prev, ...ids])]
        : prev.filter((x) => !ids.includes(x))
    )
  }

  async function handleSaveCategories() {
    setSavingCats(true)
    try {
      const { data } = await SellerApi.shop.setCategories(selectedCatIds)
      setShop(data.model)
      setSelectedCatIds((data.model.categories ?? []).map((c) => c.id))
      toast.success(t('seller.categoriesSaved'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setSavingCats(false)
    }
  }

  async function handleSaveIban(e) {
    e.preventDefault()
    setSavingIban(true)
    try {
      const fd = new FormData()
      if (ibanForm.bank_iban   !== undefined) fd.append('bank_iban',   ibanForm.bank_iban)
      if (ibanForm.card_number !== undefined) fd.append('card_number', ibanForm.card_number)
      const { data } = await SellerApi.shop.uploadDocs(fd)
      setShop(data.model)
      toast.success(t('toast.saved'))
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setSavingIban(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  const tier = TIER[shop?.seller_tier ?? 0]
  const vs   = VS[shop?.verification_status ?? 0]
  const VsIcon = vs.icon

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-4">
            <LogoUpload
              logoUrl={imgUrl(shop?.logo)}
              onUploaded={(updated) => setShop(updated)}
            />
            <div className="flex-1 min-w-0 space-y-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {shop?.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium', tier.className)}>
                  {shop?.seller_tier === 2 && <Star className="h-3 w-3" />}
                  {tier.label}
                </span>
                <span className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-white/10', vs.className)}>
                  <VsIcon className="h-3 w-3" />
                  {vs.label}
                </span>
                {shop?.type && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    {shop.type.name}
                  </span>
                )}
              </div>
              {shop?.verification_note && shop?.verification_status === 3 && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                  <span className="font-medium">Sebäp:</span> {shop.verification_note}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t('shops.tabInfo')}</TabsTrigger>
          <TabsTrigger value="categories">{t('seller.categoriesTitle')}</TabsTrigger>
          <TabsTrigger value="documents">Resminamalar</TabsTrigger>
        </TabsList>

        {/* ── Info tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleSaveInfo} className="space-y-5">
                {/* Names */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dükan ady</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Türkmençe <span className="text-red-500">*</span></Label>
                      <Input {...field('name')} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rusça</Label>
                      <Input {...field('name_ru')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Iňlisçe</Label>
                      <Input {...field('name_eng')} />
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Beýany</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Türkmençe</Label>
                      <Textarea {...field('description_tm')} rows={3} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rusça</Label>
                      <Textarea {...field('description_ru')} rows={3} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Iňlisçe</Label>
                      <Textarea {...field('description_en')} rows={3} />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Habarlaşmak</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Telefon</Label>
                      <Input {...field('phone')} placeholder="6XXXXXXX" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-mail</Label>
                      <Input {...field('email')} type="email" placeholder="shop@example.tm" />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label>Salgy</Label>
                  <Input {...field('address')} placeholder="Şäher, köçe, jaý" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('seller.saving')}</> : t('common.save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categories tab ───────────────────────────────────────────────── */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{t('seller.categoriesTitle')}</CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Dükanyňyzyň hödürleýän haryt kategoriýalaryny saýlaň.
                  </p>
                </div>
                {/* View toggle */}
                <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setCatView('tree')}
                    title="Tree view"
                    className={cn(
                      'p-2 transition-colors',
                      catView === 'tree'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatView('grid')}
                    title="Grid view"
                    className={cn(
                      'p-2 transition-colors',
                      catView === 'grid'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {allCategories.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Kategoriýalar ýüklenýär…</p>
              ) : catView === 'tree' ? (
                <CategoryTree
                  categories={allCategories}
                  selected={selectedCatIds}
                  onBulkToggle={bulkToggleCat}
                />
              ) : (
                <CategoryPicker
                  categories={allCategories}
                  selected={selectedCatIds}
                  onToggle={toggleCat}
                />
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <span className="text-xs text-slate-400">
                  {selectedCatIds.length > 0
                    ? `${selectedCatIds.length} ${t('seller.categoriesTitle').toLowerCase()}`
                    : t('seller.notSelected')}
                </span>
                <Button size="sm" onClick={handleSaveCategories} disabled={savingCats}>
                  {savingCats
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t('seller.saving')}</>
                    : t('seller.saveCategories')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents tab ────────────────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-5">
          {/* Shop type */}
          <ShopTypeSection shop={shop} />

          {/* KYC Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Resminamalar</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                Patent we bank IBAN bolan dükanlara{' '}
                <span className="font-medium text-purple-600 dark:text-purple-400">Verified PRO</span>{' '}
                derejesi berilýär.
              </p>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-slate-100 dark:divide-white/[0.06]">
              <DocRow
                icon={FileImage}
                label={t('seller.passport')}
                fieldName="passport_file"
                currentPath={shop?.passport_file}
                onUploaded={setShop}
                accept="image/*,application/pdf"
              />
              <DocRow
                icon={FileText}
                label={t('seller.patent')}
                fieldName="patent_file"
                currentPath={shop?.patent_file}
                onUploaded={setShop}
                accept="image/*,application/pdf"
              />
              <DocRow
                icon={Video}
                label={t('seller.verVideo')}
                fieldName="video_url"
                currentPath={shop?.video_url}
                onUploaded={setShop}
                accept="video/mp4,video/quicktime,video/webm"
              />
            </CardContent>
          </Card>

          {/* Payment details */}
          <Card>
            <CardHeader><CardTitle>Töleg maglumatlary</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveIban} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      Bank IBAN
                    </Label>
                    <Input
                      value={ibanForm.bank_iban}
                      onChange={(e) => setIbanForm((f) => ({ ...f, bank_iban: e.target.value }))}
                      placeholder="TM…"
                      maxLength={34}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      Kart belgisi
                    </Label>
                    <Input
                      value={ibanForm.card_number}
                      onChange={(e) => setIbanForm((f) => ({ ...f, card_number: e.target.value }))}
                      placeholder="8600 …"
                      maxLength={20}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingIban} variant="outline">
                    {savingIban
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saklanyp dur…</>
                      : 'Ýatda sakla'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Plan info */}
          {shop?.plan && (
            <Card>
              <CardHeader><CardTitle>Abunalyk plany</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Stat label="Plan" value={shop.plan.name} />
                  <Stat label="Komissiýa" value={`${shop.plan.commission_rate ?? 0}%`} />
                  <Stat label="Haryt limiti" value={shop.plan.product_limit ?? '∞'} />
                  {shop.plan.ai_credits_monthly != null && (
                    <Stat label="AI kreditler" value={`${shop.plan.ai_credits_monthly} / aý`} />
                  )}
                  {shop.plan.auction_per_week != null && (
                    <Stat label="Auksion / hepde" value={shop.plan.auction_per_week} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Category tree helpers ─────────────────────────────────────────────────────
function buildTree(flat) {
  const byId = {}
  flat.forEach((c) => { byId[c.id] = { ...c, children: [] } })
  const roots = []
  flat.forEach((c) => {
    if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].children.push(byId[c.id])
    else roots.push(byId[c.id])
  })
  return roots
}

function getAllLeafIds(node) {
  if (!node.children?.length) return [node.id]
  return node.children.flatMap(getAllLeafIds)
}

function TreeCheckbox({ checked, indeterminate }) {
  return (
    <div className={cn(
      'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors pointer-events-none',
      checked || indeterminate
        ? 'bg-blue-600 border-blue-600'
        : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/5'
    )}>
      {checked && !indeterminate && (
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && (
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

function TreeNode({ node, selected, onBulkToggle, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = node.children?.length > 0

  const leafIds = useMemo(() => getAllLeafIds(node), [node])
  const selCount = leafIds.filter((id) => selected.includes(id)).length
  const isChecked = leafIds.length > 0 && selCount === leafIds.length
  const isIndeterminate = selCount > 0 && !isChecked

  function handleRowClick(e) {
    e.preventDefault()
    onBulkToggle(leafIds, !isChecked)
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer select-none group',
          'hover:bg-slate-50 dark:hover:bg-white/[0.04]',
          depth > 0 && 'ml-5'
        )}
        onClick={handleRowClick}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
            className="shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
          >
            <ChevronRight className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <TreeCheckbox checked={isChecked} indeterminate={isIndeterminate} />
        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 leading-tight">{node.name}</span>
        {hasChildren && selCount > 0 && (
          <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{selCount}/{leafIds.length}</span>
        )}
      </div>
      {hasChildren && open && (
        <div className="border-l border-slate-100 dark:border-white/[0.06] ml-[22px]">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} selected={selected} onBulkToggle={onBulkToggle} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryTree({ categories, selected, onBulkToggle }) {
  const tree = useMemo(() => buildTree(categories), [categories])
  if (!tree.length) return <p className="text-sm text-slate-400 text-center py-6">Kategoriýalar ýüklenýär…</p>
  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} selected={selected} onBulkToggle={onBulkToggle} depth={0} />
      ))}
    </div>
  )
}

// ── Category picker — grouped by parent ──────────────────────────────────────
function CategoryPicker({ categories, selected, onToggle }) {
  // Separate root and children
  const roots    = categories.filter((c) => !c.parent_id)
  const children = categories.filter((c) =>  c.parent_id)
  const byParent = children.reduce((acc, c) => {
    ;(acc[c.parent_id] ??= []).push(c)
    return acc
  }, {})

  // Categories with no children that are also roots — shown in a flat "Other" group
  const standaloneRoots = roots.filter((r) => !byParent[r.id])
  const parentRoots     = roots.filter((r) =>  byParent[r.id])

  function Chip({ cat }) {
    const active = selected.includes(cat.id)
    return (
      <button
        type="button"
        onClick={() => onToggle(cat.id)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
          active
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-transparent border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
        )}
      >
        {active && <Tag className="h-3 w-3 shrink-0" />}
        {cat.name}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {parentRoots.map((root) => (
        <div key={root.id}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{root.name}</p>
          <div className="flex flex-wrap gap-2">
            {(byParent[root.id] ?? []).map((cat) => <Chip key={cat.id} cat={cat} />)}
          </div>
        </div>
      ))}
      {standaloneRoots.length > 0 && (
        <div>
          {parentRoots.length > 0 && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Beýlekiler</p>
          )}
          <div className="flex flex-wrap gap-2">
            {standaloneRoots.map((cat) => <Chip key={cat.id} cat={cat} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{value}</p>
    </div>
  )
}
