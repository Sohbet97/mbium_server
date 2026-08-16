import { useMemo, useState } from 'react'
import { Search, ChevronsUpDown, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from '@/components/ui/dialog'

/**
 * Searchable picker for a flat list ({id, name, name_ru?, name_en?, parent_id?}).
 * Unlike CategoryTreeSelect this has no nesting UI — a `parent_id` is only used to
 * show a "— Parent name" hint next to items that have one.
 */
export function SearchSelect({
  items, value, onChange, placeholder = '— Saýlaň —', title = 'Saýlaň', searchPlaceholder = 'Gözle…',
  clearable = false, clearLabel = '— Ýok —',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const byId = useMemo(() => {
    const m = {}
    ;(items ?? []).forEach((i) => { m[i.id] = i })
    return m
  }, [items])

  const selected = value ? byId[value] : null

  const openPicker = () => {
    setQuery('')
    setOpen(true)
  }

  const select = (item) => {
    onChange(item.id)
  }

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    const list = items ?? []
    if (!q) return list
    return list.filter((i) => [i.name, i.name_ru, i.name_en].some((v) => v && v.toLowerCase().includes(q)))
  }, [items, q])

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="w-full min-h-9 border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-2 text-left"
      >
        <span className={`break-words ${selected ? '' : 'text-slate-400'}`}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogBody className="max-h-[70vh]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 h-9"
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
              {clearable && !q && (
                <div
                  onClick={() => onChange(null)}
                  className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.06] ${
                    !value ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span className="truncate">{clearLabel}</span>
                  {!value && <Check className="h-3.5 w-3.5 shrink-0" />}
                </div>
              )}
              {filtered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Hiç zat tapylmady</p>
              ) : (
                filtered.map((item) => {
                  const parentName = item.parent_id ? byId[item.parent_id]?.name : null
                  return (
                    <div
                      key={item.id}
                      onClick={() => select(item)}
                      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.06] ${
                        value === item.id ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium' : 'dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">
                        {item.name}
                        {parentName && <span className="text-xs text-slate-400 ml-1.5">— {parentName}</span>}
                      </span>
                      {value === item.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </div>
                  )
                })
              )}
            </div>
          </DialogBody>
          <DialogFooter className="items-center justify-between gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400 break-words flex-1">
              {selected ? <>Saýlandy: <span className="font-medium text-slate-700 dark:text-slate-200">{selected.name}</span></> : 'Saýlanmady'}
            </span>
            <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={!selected} className="shrink-0">
              Taýýar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
