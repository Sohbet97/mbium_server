import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const EMPTY = {
  title_tk: '', title_ru: '', title_en: '',
  subtitle_tk: '', subtitle_ru: '', subtitle_en: '',
  emoji: '', prompt: '', sort_order: 0, is_active: true,
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function AiRecModal({ open, rec, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(rec ? {
        title_tk:    rec.title_tk    ?? '',
        title_ru:    rec.title_ru    ?? '',
        title_en:    rec.title_en    ?? '',
        subtitle_tk: rec.subtitle_tk ?? '',
        subtitle_ru: rec.subtitle_ru ?? '',
        subtitle_en: rec.subtitle_en ?? '',
        emoji:       rec.emoji       ?? '',
        prompt:      rec.prompt      ?? '',
        sort_order:  rec.sort_order  ?? 0,
        is_active:   rec.is_active   ?? true,
      } : EMPTY)
    }
  }, [open, rec])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.title_tk.trim() || !form.title_ru.trim() || !form.title_en.trim()) {
      setError(t('aiRecommendations.titleRequired')); return
    }
    if (!form.prompt.trim()) { setError(t('aiRecommendations.promptRequired')); return }
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        sort_order:  Number(form.sort_order) || 0,
        subtitle_tk: form.subtitle_tk || null,
        subtitle_ru: form.subtitle_ru || null,
        subtitle_en: form.subtitle_en || null,
        emoji:       form.emoji       || null,
      }
      if (rec) {
        await AdminApi.aiRecommendations.update(rec.id, payload)
        toast.success(t('aiRecommendations.saved'))
      } else {
        await AdminApi.aiRecommendations.create(payload)
        toast.success(t('aiRecommendations.created'))
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('aiRecommendations.error'))
    } finally { setSaving(false) }
  }

  const field = (label, key, props = {}) => (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <Input value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rec ? t('aiRecommendations.edit') : t('aiRecommendations.create')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>}

          {/* Emoji + sort_order + active */}
          <div className="flex gap-3 items-end">
            {field(t('aiRecommendations.emoji'), 'emoji', { placeholder: '🛍️', className: 'w-24' })}
            {field(t('aiRecommendations.sortOrder'), 'sort_order', { type: 'number', className: 'w-28' })}
            <div className="flex items-center gap-2 pb-0.5">
              <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
              <span className="text-sm text-slate-500">
                {form.is_active ? t('aiRecommendations.active') : t('aiRecommendations.hidden')}
              </span>
            </div>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-3 gap-3">
            {field(`${t('aiRecommendations.titleTk')} *`, 'title_tk', { placeholder: 'Haryt gözle' })}
            {field(`${t('aiRecommendations.titleRu')} *`, 'title_ru', { placeholder: 'Найди товар' })}
            {field(`${t('aiRecommendations.titleEn')} *`, 'title_en', { placeholder: 'Find product' })}
          </div>

          {/* Subtitles */}
          <div className="grid grid-cols-3 gap-3">
            {field(t('aiRecommendations.subtitleTk'), 'subtitle_tk', { placeholder: 'Goşmaça maglumat...' })}
            {field(t('aiRecommendations.subtitleRu'), 'subtitle_ru', { placeholder: 'Дополнительно...' })}
            {field(t('aiRecommendations.subtitleEn'), 'subtitle_en', { placeholder: 'Additional info...' })}
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t('aiRecommendations.prompt')} *
            </label>
            <textarea
              value={form.prompt}
              onChange={(e) => set('prompt', e.target.value)}
              rows={4}
              placeholder={t('aiRecommendations.promptPlaceholder')}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm resize-none',
                'border-input bg-background ring-offset-background',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'dark:bg-[#1a1a1f] dark:border-white/[0.08] dark:text-white',
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('aiRecommendations.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('aiRecommendations.saving') : t('aiRecommendations.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AiRecommendationsPage() {
  const { t } = useTranslation()
  const [recs, setRecs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await AdminApi.aiRecommendations.getAll()
      setRecs(data.data ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(rec) { setEditing(rec); setModalOpen(true) }

  async function handleDelete(rec) {
    if (!confirm(t('aiRecommendations.confirmDelete', { name: rec.title_en }))) return
    try {
      await AdminApi.aiRecommendations.delete(rec.id)
      toast.success(t('aiRecommendations.deleted'))
      load()
    } catch { toast.error(t('aiRecommendations.error')) }
  }

  function handleSaved() { setModalOpen(false); load() }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dark:text-white">{t('aiRecommendations.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('aiRecommendations.subtitle')}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />{t('aiRecommendations.create')}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !recs.length ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 text-sm">
            {t('aiRecommendations.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recs.map((rec) => (
            <Card key={rec.id} className={cn(!rec.is_active && 'opacity-50')}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-slate-300 dark:text-white/20 mt-1 shrink-0" />

                  <div className="text-2xl leading-none mt-0.5 shrink-0 w-8 text-center">
                    {rec.emoji || '🤖'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm dark:text-white">{rec.title_en}</span>
                      {rec.title_tk !== rec.title_en && (
                        <span className="text-xs text-slate-400">{rec.title_tk}</span>
                      )}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                        rec.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400'
                      )}>
                        {rec.is_active ? t('aiRecommendations.active') : t('aiRecommendations.hidden')}
                      </span>
                      <span className="text-[10px] text-slate-300 dark:text-white/20">
                        #{rec.sort_order}
                      </span>
                    </div>
                    {rec.subtitle_en && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{rec.subtitle_en}</p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate italic">
                      {rec.prompt}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(rec)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleDelete(rec)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AiRecModal
        open={modalOpen}
        rec={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
