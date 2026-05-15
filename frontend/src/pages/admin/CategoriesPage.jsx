import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronRight, MoreHorizontal, RefreshCw, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MultiLangInput } from '@/components/common/MultiLangInput'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'

const EMPTY_FORM = { name: '', name_ru: '', name_eng: '', slug: '', parent_id: '', icon: '', order: '', seo_title: '', seo_description: '' }

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

function CategoryModal({ open, category, allCategories, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setError('')
      setSlugTouched(false)
      setForm(category
        ? {
          name: category.name ?? '', name_ru: category.name_ru ?? '', name_eng: category.name_eng ?? '',
          slug: category.slug ?? '', parent_id: category.parent_id ?? '',
          icon: category.icon ?? '', order: category.order ?? '',
          seo_title: category.seo_title ?? '', seo_description: category.seo_description ?? '',
        }
        : EMPTY_FORM
      )
    }
  }, [open, category])

  function set(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'name' && !slugTouched && !category) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id !== '' ? Number(form.parent_id) : null,
        order: form.order !== '' ? Number(form.order) : undefined,
      }
      if (category?.id) {
        await AdminApi.categories.update(category.id, payload)
      } else {
        await AdminApi.categories.create(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error saving category')
    } finally {
      setSaving(false)
    }
  }

  const eligible = allCategories.filter((c) => !category || c.id !== category.id)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? t('categories.editCategory') : t('categories.createCategory')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <MultiLangInput baseField="name" label={t('common.name')} required values={form} onChange={set} />

          <FormField label={t('categories.slug')} required>
            <Input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set('slug', e.target.value) }}
              placeholder="electronics"
            />
            <p className="text-xs text-slate-400 mt-0.5">{t('categories.slugHint')}</p>
          </FormField>

          <FormField label={t('categories.parentCategory')}>
            <Select value={form.parent_id} onChange={(e) => set('parent_id', e.target.value)}>
              <option value="">{t('categories.noParent')}</option>
              {eligible.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('categories.icon')}>
              <Input value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="📱 or URL" />
            </FormField>
            <FormField label={t('categories.order')}>
              <Input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} min={0} />
            </FormField>
          </div>

          <FormField label={t('categories.seoTitle')}>
            <Input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} maxLength={70} />
          </FormField>
          <FormField label={t('categories.seoDescription')}>
            <Input value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.loading') : category ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CategoryRow({ cat, depth = 0, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const hasChildren = cat.children?.length > 0

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button onClick={() => setExpanded((v) => !v)} className="text-slate-400 hover:text-slate-600">
                <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="w-4" />
            )}
            {cat.icon && <span className="text-base">{cat.icon}</span>}
            <div>
              <p className="text-sm font-medium text-slate-900">{cat.name}</p>
              <p className="text-xs text-slate-400 font-mono">{cat.slug}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-500">
          {hasChildren && (
            <Badge variant="secondary">{cat.children.length} {t('categories.children')}</Badge>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-slate-400">{cat.order ?? '—'}</td>
        <td className="px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(cat)}>{t('common.edit')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(cat)}>
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {expanded && hasChildren && cat.children.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  )
}

export default function CategoriesPage() {
  const { t } = useTranslation()
  const [tree, setTree] = useState([])
  const [flat, setFlat] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const [treeRes, flatRes] = await Promise.all([
        AdminApi.categories.tree(),
        AdminApi.categories.getAll({ limit: 500 }),
      ])
      setTree(treeRes.data?.data ?? [])
      setFlat(flatRes.data?.data?.rows ?? flatRes.data?.data?.categories ?? [])
    } catch { setTree([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  async function handleDelete(cat) {
    if (!window.confirm(t('categories.confirmDelete'))) return
    await AdminApi.categories.delete(cat.id).catch(() => {})
    fetchCategories()
  }

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(cat) { setEditing(cat); setModalOpen(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('categories.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{flat.length} {t('categories.title').toLowerCase()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchCategories} className="h-9 w-9" title={t('common.refresh')}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> {t('categories.addCategory')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">{t('common.name')}</th>
                  <th className="px-4 py-3">Sub</th>
                  <th className="px-4 py-3">{t('categories.order')}</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading && tree.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">{t('common.loading')}</td></tr>
                ) : tree.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center">
                      <FolderTree className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : tree.map((cat) => (
                  <CategoryRow key={cat.id} cat={cat} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CategoryModal
        open={modalOpen}
        category={editing}
        allCategories={flat}
        onClose={() => setModalOpen(false)}
        onSaved={fetchCategories}
      />
    </div>
  )
}
