import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Search, RefreshCw, MoreHorizontal,
  FolderTree, LayoutList, Network, ChevronRight, ChevronDown,
} from 'lucide-react'
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
import { toast } from 'sonner'

// ── Utilities ─────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

// Build nested tree from a flat array using _children (avoids backend status:1 filter)
function buildTree(flat) {
  const map = {}
  const roots = []
  flat.forEach((c) => { map[c.id] = { ...c, _children: [] } })
  flat.forEach((c) => {
    if (c.parent_id != null && map[c.parent_id]) {
      map[c.parent_id]._children.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
}

// ── Category Modal ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', name_ru: '', name_eng: '',
  slug: '', parent_id: '', icon: '', image: '', order: '',
  seo_title: '', seo_description: '',
}

function buildForm(category) {
  if (!category) return EMPTY_FORM
  return {
    name:            category.name            ?? '',
    name_ru:         category.name_ru         ?? '',
    name_eng:        category.name_eng        ?? '',
    slug:            category.slug            ?? '',
    parent_id:       category.parent_id       ?? '',
    icon:            category.icon            ?? '',
    image:           category.image           ?? '',
    order:           category.order           ?? '',
    seo_title:       category.seo_title       ?? '',
    seo_description: category.seo_description ?? '',
  }
}

function CategoryModal({ open, category, allCategories, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm]             = useState(() => buildForm(category))
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState('')
  const [slugTouched, setSlugTouched] = useState(() => Boolean(category))

  function set(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'name' && !slugTouched) next.slug = slugify(value)
      return next
    })
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(''); setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await AdminApi.media.upload(formData)
      set('image', data?.data?.url ?? '')
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error')
    } finally {
      setUploading(false)
    }
  }

  const isValid = Boolean(form.name.trim() && form.slug.trim())

  async function handleSave() {
    if (!isValid) return
    setError(''); setSaving(true)
    try {
      const payload = {
        name:            form.name.trim(),
        name_ru:         form.name_ru.trim()  || null,
        name_eng:        form.name_eng.trim() || null,
        slug:            form.slug.trim(),
        parent_id:       form.parent_id !== '' ? Number(form.parent_id) : null,
        icon:            form.icon.trim() || null,
        image:           form.image.trim() || null,
        order:           form.order !== '' ? Number(form.order) : null,
        seo_title:       form.seo_title.trim()       || null,
        seo_description: form.seo_description.trim() || null,
      }
      if (category) {
        await AdminApi.categories.update(category.id, payload)
      } else {
        await AdminApi.categories.create(payload)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  const eligible = allCategories.filter((c) => !category || c.id !== category.id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? t('categories.editCategory') : t('categories.createCategory')}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[75vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

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
              <Input type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} />
            </FormField>
          </div>

          <FormField label={t('categories.image')}>
            <div className="flex items-center gap-3">
              {form.image ? (
                <img src={form.image} alt="" className="h-14 w-14 rounded object-cover border flex-shrink-0" />
              ) : (
                <div className="h-14 w-14 rounded border border-dashed flex-shrink-0" />
              )}
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleImageChange}
                  className="text-sm text-slate-500 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
                />
                {uploading && <p className="text-xs text-slate-400">{t('common.loading')}</p>}
                {form.image && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => set('image', '')}
                  >
                    {t('common.remove', 'Remove')}
                  </button>
                )}
              </div>
            </div>
          </FormField>

          <FormField label={t('categories.seoTitle')}>
            <Input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} maxLength={70} />
          </FormField>
          <FormField label={t('categories.seoDescription')}>
            <Input value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} maxLength={160} />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? '…' : category ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Tree Row (recursive) ──────────────────────────────────────────────────────

function CategoryTreeRow({ cat, depth = 0, forceExpand, onEdit, onDelete }) {
  const { t } = useTranslation()
  const [localExpanded, setLocalExpanded] = useState(true)
  const expanded = forceExpand != null ? forceExpand : localExpanded
  const hasChildren = cat._children?.length > 0

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 22}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setLocalExpanded((v) => !v)}
                className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0"
              >
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="w-5 flex-shrink-0" />
            )}
            {cat.image ? (
              <img src={cat.image} alt="" className="h-6 w-6 rounded object-cover flex-shrink-0" />
            ) : cat.icon ? (
              <span className="text-sm flex-shrink-0">{cat.icon}</span>
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{cat.name}</p>
              {cat.name_ru && (
                <p className="text-xs text-slate-400 truncate">{cat.name_ru}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-2.5 text-sm text-slate-500">
          {hasChildren
            ? <Badge variant="secondary">{cat._children.length} {t('categories.children')}</Badge>
            : <span className="text-slate-300">—</span>
          }
        </td>
        <td className="px-4 py-2.5 text-sm text-slate-500">{cat.order ?? '—'}</td>
        <td className="px-4 py-2.5">
          <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {cat.slug}
          </code>
        </td>
        <td className="px-4 py-2.5">
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
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(cat)}
              >
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {expanded && hasChildren && cat._children.map((child) => (
        <CategoryTreeRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          forceExpand={forceExpand}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { t } = useTranslation()

  const [categories,   setCategories]   = useState([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [viewMode,     setViewMode]     = useState('list') // 'list' | 'tree'
  const [refreshTick,  setRefreshTick]  = useState(0)
  const [modal,        setModal]        = useState({ open: false, category: null })
  const [forceExpand,  setForceExpand]  = useState(null)

  // Tree fetches all at once; list paginates
  const listLimit = 50
  const fetchLimit = viewMode === 'tree' ? 500 : listLimit

  useEffect(() => {
    let cancelled = false
    const params = { limit: fetchLimit, skip: (page - 1) * fetchLimit }
    if (search) params.text = search

    AdminApi.categories.getAll(params)
      .then(({ data }) => {
        if (cancelled) return
        setCategories(data.data  ?? [])
        setTotal(data.count ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setCategories([])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, search, viewMode, fetchLimit, refreshTick])

  function refresh() { setLoading(true); setRefreshTick((k) => k + 1) }

  function handleSearchChange(val) { setSearch(val); setLoading(true); setPage(1) }
  function handlePageChange(next) { setPage(next); setLoading(true) }

  function switchView(mode) {
    if (mode === viewMode) return
    setViewMode(mode)
    setPage(1)
    setLoading(true)
    setForceExpand(null)
  }

  async function handleDelete(cat) {
    if (!window.confirm(t('categories.confirmDelete'))) return
    try {
      await AdminApi.categories.delete(cat.id)
      toast.success(t('toast.deleted'))
      refresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  function openEdit(cat) { setModal({ open: true, category: cat }) }

  const totalPages = Math.ceil(total / listLimit)
  const treeData   = viewMode === 'tree' ? buildTree(categories) : []

  // Shared table header columns
  const colLabel2 = viewMode === 'tree' ? t('categories.children') : t('categories.parentCategory')

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('categories.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} {t('categories.title').toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none border-0"
              title="List view"
              onClick={() => switchView('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border" />
            <Button
              variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none border-0"
              title="Tree view"
              onClick={() => switchView('tree')}
            >
              <Network className="h-4 w-4" />
            </Button>
          </div>

          {viewMode === 'tree' && (
            <>
              <Button variant="ghost" size="sm" className="gap-1 h-9 text-xs" onClick={() => setForceExpand(true)}>
                <ChevronDown className="h-3.5 w-3.5" />{t('common.expandAll', 'Expand all')}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 h-9 text-xs" onClick={() => setForceExpand(false)}>
                <ChevronRight className="h-3.5 w-3.5" />{t('common.collapseAll', 'Collapse all')}
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={refresh} className="h-9 w-9" title={t('common.refresh')}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setModal({ open: true, category: null })}>
            <Plus className="h-4 w-4" /> {t('categories.addCategory')}
          </Button>
        </div>
      </div>

      {/* Search (hidden in tree mode — tree shows all anyway) */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('common.search')}
              className="pl-9"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-black dark:text-white text-xs font-medium text-slate-500  uppercase tracking-wide">
                  <th className="px-4 py-3">{t('common.name')}</th>
                  <th className="px-4 py-3">{colLabel2}</th>
                  <th className="px-4 py-3">{t('categories.order')}</th>
                  <th className="px-4 py-3">{t('categories.slug')}</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {loading && categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <FolderTree className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : viewMode === 'tree' ? (
                  treeData.map((cat) => (
                    <CategoryTreeRow
                      key={cat.id}
                      cat={cat}
                      depth={0}
                      forceExpand={forceExpand}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {cat.image ? (
                            <img src={cat.image} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                          ) : cat.icon ? (
                            <span className="text-base">{cat.icon}</span>
                          ) : null}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{cat.name}</p>
                            {cat.name_ru && (
                              <p className="text-xs text-slate-400 truncate">{cat.name_ru}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {cat.parent
                          ? <Badge variant="secondary">{cat.parent.name}</Badge>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{cat.order ?? '—'}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {cat.slug}
                        </code>
                      </td>
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
                            <DropdownMenuItem onClick={() => openEdit(cat)}>
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDelete(cat)}
                            >
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination — list mode only */}
          {viewMode === 'list' && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
              <span>{t('common.page', { current: page, total: totalPages })}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryModal
        key={modal.open ? (modal.category?.id ?? 'create') : 'closed'}
        open={modal.open}
        category={modal.category}
        allCategories={categories}
        onClose={() => setModal({ open: false, category: null })}
        onSaved={() => { toast.success(t(modal.category ? 'toast.updated' : 'toast.created')); setModal({ open: false, category: null }); refresh() }}
      />
    </div>
  )
}
