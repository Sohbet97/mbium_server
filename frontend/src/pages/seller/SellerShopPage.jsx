import { useEffect, useRef, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Camera, FileText, Upload, CheckCircle2, Clock, XCircle, Star, CreditCard, Video, FileImage, Loader2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      toast.success('Logo ýüklenildi')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Ýalňyşlyk')
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
        <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
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

// ── Single document upload row ────────────────────────────────────────────────
function DocRow({ icon: Icon, label, fieldName, currentPath, onUploaded, accept = '*' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const filename = currentPath ? currentPath.split('/').pop() : null

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append(fieldName, file)
      const { data } = await SellerApi.shop.uploadDocs(fd)
      onUploaded(data.model)
      toast.success(`${label} ýüklenildi`)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
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
        {uploading ? 'Ýüklenýär…' : 'Saýla'}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerShopPage() {
  const [shop, setShop]                       = useState(null)
  const [form, setForm]                       = useState({})
  const [ibanForm, setIbanForm]               = useState({ bank_iban: '', card_number: '' })
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [savingIban, setSavingIban]           = useState(false)
  const [allCategories, setAllCategories]     = useState([])
  const [selectedCatIds, setSelectedCatIds]   = useState([])
  const [savingCats, setSavingCats]           = useState(false)

  useEffect(() => {
    SellerApi.categories.getAll()
      .then(({ data }) => setAllCategories(data.data ?? []))
      .catch(() => {})
  }, [])

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
      toast.success('Maglumatlar ýatda saklandy')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setSaving(false)
    }
  }

  function toggleCat(id) {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSaveCategories() {
    setSavingCats(true)
    try {
      const { data } = await SellerApi.shop.setCategories(selectedCatIds)
      setShop(data.model)
      setSelectedCatIds((data.model.categories ?? []).map((c) => c.id))
      toast.success('Kategoriýalar ýatda saklandy')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Ýalňyşlyk')
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
      toast.success('Töleg maglumatlary ýatda saklandy')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Ýalňyşlyk')
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
    <div className="space-y-6 max-w-2xl">

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

      {/* ── Basic info ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Dükan maglumatlary</CardTitle></CardHeader>
        <CardContent>
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
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saklanyp dur…</> : 'Ýatda sakla'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Categories ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Kategoriýalar</CardTitle>
          <p className="text-sm text-slate-500 mt-0.5">
            Dükanyňyzyň hödürleýän haryt kategoriýalaryny saýlaň.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {allCategories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Kategoriýalar ýüklenýär…</p>
          ) : (
            <CategoryPicker
              categories={allCategories}
              selected={selectedCatIds}
              onToggle={toggleCat}
            />
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              {selectedCatIds.length > 0
                ? `${selectedCatIds.length} kategoriýa saýlandy`
                : 'Saýlanmady'}
            </span>
            <Button size="sm" onClick={handleSaveCategories} disabled={savingCats}>
              {savingCats ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saklanyp dur…</> : 'Ýatda sakla'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KYC Documents ──────────────────────────────────────────────────── */}
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
            label="Passport / Şahadatnama"
            fieldName="passport_file"
            currentPath={shop?.passport_file}
            onUploaded={setShop}
            accept="image/*,application/pdf"
          />
          <DocRow
            icon={FileText}
            label="Patent faýly"
            fieldName="patent_file"
            currentPath={shop?.patent_file}
            onUploaded={setShop}
            accept="image/*,application/pdf"
          />
          <DocRow
            icon={Video}
            label="Tanyşdyryş wideo"
            fieldName="video_url"
            currentPath={shop?.video_url}
            onUploaded={setShop}
            accept="video/mp4,video/quicktime,video/webm"
          />
        </CardContent>
      </Card>

      {/* ── Payment details ─────────────────────────────────────────────────── */}
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
                {savingIban ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saklanyp dur…</> : 'Ýatda sakla'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Plan info ───────────────────────────────────────────────────────── */}
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
