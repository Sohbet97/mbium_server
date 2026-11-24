import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminApi } from '@/lib/api'
import { absUrl } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { hasPerm, Permissions } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FormField } from '@/components/common/FormField'

// Static pages (privacy policy, …) shown in the mobile app and its WebView.
// Content is Markdown per language; the preview uses the backend renderer the app gets.

const LANGS = [
  { code: 'tk', suffix: '',     flag: '🇹🇲', required: true },
  { code: 'ru', suffix: '_ru',  flag: '🇷🇺' },
  { code: 'en', suffix: '_eng', flag: '🇬🇧' },
]
const FIELDS = ['title', 'title_ru', 'title_eng', 'content', 'content_ru', 'content_eng', 'is_published']

const toForm = (page) => Object.fromEntries(FIELDS.map((f) => [f, page[f] ?? (f === 'is_published' ? false : '')]))

function Preview({ content }) {
  const { t } = useTranslation()
  const [html, setHtml] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      AdminApi.pages.preview(content).then(({ data }) => setHtml(data.html)).catch(() => {})
    }, 400)
    return () => clearTimeout(timer)
  }, [content])

  return (
    <div className="rounded-md border dark:border-white/[0.08] p-4 h-[60vh] overflow-y-auto">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">{t('pages.preview')}</p>
      {/* html comes from the backend renderer, which escapes all raw HTML */}
      <div className="static-page-preview text-sm" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

export default function AdminPagesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const canEdit = hasPerm(user, Permissions.PAGE_PUT)
  const [pages, setPages] = useState([])
  const [slug, setSlug] = useState('')
  const [form, setForm] = useState(null)
  const [lang, setLang] = useState('tk')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AdminApi.pages.getAll()
      .then(({ data }) => {
        const list = data.data ?? []
        setPages(list)
        const first = list.find((p) => p.slug === 'privacy') ?? list[0]
        if (first) { setSlug(first.slug); setForm(toForm(first)) }
      })
      .catch((e) => toast.error(e.response?.data?.message ?? t('toast.error')))
      .finally(() => setLoading(false))
  }, [t])

  function selectPage(next) {
    const page = pages.find((p) => p.slug === next)
    if (!page) return
    setSlug(next); setForm(toForm(page))
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    if (!form.title.trim()) { setLang('tk'); toast.error(t('pages.titleRequired')); return }
    setSaving(true)
    try {
      const { data } = await AdminApi.pages.update(slug, form)
      setPages((list) => list.map((p) => (p.slug === slug ? data.model : p)))
      toast.success(t('toast.saved'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
  if (!form) return <p className="text-sm text-slate-500 py-16 text-center">{t('pages.empty')}</p>

  const saved = pages.find((p) => p.slug === slug)
  const webUrl = (code) => absUrl(`/pages/${slug}?lang=${code}`)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold dark:text-white">{t('pages.title')}</h1>
          <p className="text-sm text-slate-500">{t('pages.subtitle')}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {pages.length > 1 && (
            <Select value={slug} onChange={(e) => selectPage(e.target.value)} className="w-48">
              {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
            </Select>
          )}
          <div className="flex items-center gap-2 rounded-md border dark:border-white/[0.08] px-3 py-2">
            <Switch checked={form.is_published} disabled={!canEdit} onCheckedChange={(v) => set('is_published', v)} />
            <Label>{t('pages.published')}</Label>
          </div>
          {saved?.is_published && (
            <a href={webUrl(lang)} target="_blank" rel="noreferrer">
              <Button variant="outline" type="button"><ExternalLink className="h-4 w-4 mr-2" />{t('pages.openPage')}</Button>
            </a>
          )}
          {canEdit && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t('common.save')}
            </Button>
          )}
        </div>
      </div>

      {saved && !saved.is_published && (
        <p className="text-sm rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-3 py-2">
          {t('pages.notPublished')}
        </p>
      )}
      {saved?.is_published && (
        <p className="text-xs text-slate-500 break-all">
          {t('pages.publicLinks')}: <span className="font-mono">{webUrl('tk')}</span> · API: <span className="font-mono">GET /buyer/pages/{slug}?lang=tk|ru|en</span>
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <Tabs value={lang} onValueChange={setLang}>
            <TabsList>
              {LANGS.map(({ code, flag, required }) => (
                <TabsTrigger key={code} value={code} className="gap-1.5">
                  <span>{flag}</span>{code.toUpperCase()}{required && <span className="text-red-500">*</span>}
                </TabsTrigger>
              ))}
            </TabsList>
            {LANGS.map(({ code, suffix, required }) => (
              <TabsContent key={code} value={code} className="space-y-4 mt-4">
                <FormField label={t('pages.pageTitle')} required={required}>
                  <Input
                    value={form[`title${suffix}`]}
                    disabled={!canEdit}
                    onChange={(e) => set(`title${suffix}`, e.target.value)}
                    placeholder={required ? '' : t('pages.fallbackHint')}
                  />
                </FormField>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FormField label={t('pages.content')}>
                    <Textarea
                      className="h-[60vh] font-mono text-sm"
                      value={form[`content${suffix}`]}
                      disabled={!canEdit}
                      onChange={(e) => set(`content${suffix}`, e.target.value)}
                      placeholder={required ? '' : t('pages.fallbackHint')}
                    />
                    <p className="text-xs text-slate-500 mt-1">{t('pages.markdownHint')}</p>
                  </FormField>
                  {lang === code && <Preview content={form[`content${suffix}`]} />}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
