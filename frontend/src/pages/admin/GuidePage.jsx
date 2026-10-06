import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Film, Plus, Pencil, Trash2, Loader2, Video, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminApi } from '@/lib/api'
import { absUrl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { MediaPicker } from '@/components/media/MediaPicker'

const LANGS = [
  { code: 'tk', suffix: '',     flag: '🇹🇲', required: true },
  { code: 'ru', suffix: '_ru',  flag: '🇷🇺' },
  { code: 'en', suffix: '_eng', flag: '🇬🇧' },
]

const EMPTY = {
  title: '', title_ru: '', title_eng: '',
  description: '', description_ru: '', description_eng: '',
  video: '', thumbnail: '', order: 0, status: 0,
}

function GuideModal({ guide, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm]     = useState(guide ? { ...EMPTY, ...Object.fromEntries(Object.entries(guide).filter(([k]) => k in EMPTY).map(([k, v]) => [k, v ?? EMPTY[k]])) } : EMPTY)
  const [picker, setPicker] = useState(null) // 'video' | 'image'
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function onPick(item) {
    if (picker === 'video') {
      set('video', item.url)
      if (!form.thumbnail && item.thumbnail_url) set('thumbnail', item.thumbnail_url)
    } else {
      set('thumbnail', item.thumbnail_url || item.url)
    }
    setPicker(null)
  }

  async function save() {
    if (!form.title.trim()) { setError(t('guide.titleRequired')); return }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, order: Number(form.order) || 0 }
      if (guide) await AdminApi.guide.update(guide.id, payload)
      else await AdminApi.guide.create(payload)
      toast.success(t(guide ? 'toast.updated' : 'toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{guide ? t('guide.edit') : t('guide.add')}</DialogTitle>
        </DialogHeader>

        <DialogBody className="pb-4">
          <Tabs defaultValue="tk">
            <TabsList className="w-full">
              {LANGS.map(({ code, flag, required }) => (
                <TabsTrigger key={code} value={code} className="flex-1 gap-1.5">
                  <span>{flag}</span>
                  {code.toUpperCase()}
                  {required && <span className="text-red-500">*</span>}
                </TabsTrigger>
              ))}
            </TabsList>
            {LANGS.map(({ code, suffix, required }) => (
              <TabsContent key={code} value={code} className="space-y-4">
                <FormField label={t('guide.titleField')} required={required}>
                  <Input
                    value={form[`title${suffix}`] ?? ''}
                    onChange={(e) => set(`title${suffix}`, e.target.value)}
                    placeholder={required ? t('guide.requiredHint', 'Required') : t('guide.optionalHint', 'Optional')}
                  />
                </FormField>
                <FormField label={t('guide.description')}>
                  <Textarea
                    rows={4}
                    value={form[`description${suffix}`] ?? ''}
                    onChange={(e) => set(`description${suffix}`, e.target.value)}
                    placeholder={t('guide.optionalHint', 'Optional')}
                  />
                </FormField>
              </TabsContent>
            ))}
          </Tabs>

          <FormField label={t('guide.video')}>
            {form.video && <video src={absUrl(form.video)} controls className="w-full max-h-56 rounded-lg bg-black" />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPicker('video')}>
                <Video className="h-3.5 w-3.5 mr-1.5" />
                {form.video ? t('guide.changeVideo') : t('guide.chooseVideo')}
              </Button>
              {form.video && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set('video', '')}>{t('guide.remove')}</Button>
              )}
            </div>
          </FormField>

          <FormField label={t('guide.thumbnail')}>
            {form.thumbnail && <img src={absUrl(form.thumbnail)} alt="" className="h-28 rounded-lg object-cover" />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPicker('image')}>
                <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
                {form.thumbnail ? t('guide.changeImage') : t('guide.chooseImage')}
              </Button>
              {form.thumbnail && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set('thumbnail', '')}>{t('guide.remove')}</Button>
              )}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('guide.order')}>
              <Input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} />
            </FormField>
            <FormField label={t('guide.status')}>
              <select
                value={form.status}
                onChange={(e) => set('status', Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={0}>{t('guide.draft')}</option>
                <option value={1}>{t('guide.published')}</option>
              </select>
            </FormField>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>

        <MediaPicker
          open={!!picker}
          onClose={() => setPicker(null)}
          onSelect={onPick}
          filterType={picker === 'video' ? 'video' : 'image'}
        />
      </DialogContent>
    </Dialog>
  )
}

export default function GuidePage() {
  const { t } = useTranslation()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | {} (new) | guide

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await AdminApi.guide.getAll({ limit: 200 })
      setItems(data.data ?? [])
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  async function remove(g) {
    if (!window.confirm(t('guide.deleteConfirm'))) return
    try {
      await AdminApi.guide.delete(g.id)
      toast.success(t('toast.deleted'))
      load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Film className="h-5 w-5" /> {t('guide.title')}
        </h1>
        <Button size="sm" onClick={() => setEditing({})}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> {t('guide.add')}
        </Button>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] text-left text-slate-500 dark:text-slate-400">
              <th className="px-4 py-2.5 font-medium w-16">{t('guide.order')}</th>
              <th className="px-4 py-2.5 font-medium">{t('guide.titleField')}</th>
              <th className="px-4 py-2.5 font-medium">{t('guide.video')}</th>
              <th className="px-4 py-2.5 font-medium">{t('guide.status')}</th>
              <th className="px-4 py-2.5 w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">{t('guide.empty')}</td></tr>
            ) : items.map((g) => (
              <tr key={g.id} className="border-b last:border-0 dark:border-white/[0.06]">
                <td className="px-4 py-3 text-slate-500">{g.order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {g.thumbnail
                      ? <img src={absUrl(g.thumbnail)} alt="" className="h-10 w-16 rounded object-cover" />
                      : <div className="h-10 w-16 rounded bg-slate-100 dark:bg-white/5" />}
                    <div className="min-w-0">
                      <p className="font-medium dark:text-white truncate">{g.title}</p>
                      {g.title_ru && <p className="text-xs text-slate-400 truncate">{g.title_ru}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{g.video ? '✓' : '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full',
                    g.status === 1
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                  )}>
                    {g.status === 1 ? t('guide.published') : t('guide.draft')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => remove(g)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <GuideModal
          guide={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}
