import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Single-select swatch picker over the `colors` palette.
// `value` / `onChange` are the colour's hex (or '' / null for none).
export function ColorSelect({ colors = [], value, onChange, disabled, className }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const selected = colors.find((c) => c.hex === value) ?? null

  function pick(hex) {
    onChange(hex)
    setOpen(false)
  }

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm',
          'dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {selected ? (
          <>
            <span
              className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/20 dark:ring-white/25"
              style={{ backgroundColor: selected.hex }}
            />
            <span className="truncate">{selected.name}</span>
            <span className="text-xs opacity-40 font-mono">{selected.hex}</span>
          </>
        ) : (
          <span className="opacity-50">{t('colors.none')}</span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('common.clear', 'Clear')}
              onClick={(e) => { e.stopPropagation(); pick('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); pick('') } }}
              className="opacity-40 hover:opacity-80"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} className="opacity-40" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-white p-1 shadow-lg dark:bg-[#1a1a1f] dark:border-white/10 border-slate-200">
          {colors.length === 0 ? (
            <p className="px-2 py-3 text-xs opacity-50">{t('colors.empty')}</p>
          ) : (
            colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => pick(c.hex)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/20 dark:ring-white/25"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="truncate">{c.name}</span>
                <span className="text-xs opacity-40 font-mono">{c.hex}</span>
                {c.hex === value && <Check size={13} className="ml-auto opacity-70" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Multi-select swatch dropdown, for list filters. `value` is an array of hexes.
export function ColorFilter({ colors = [], value = [], onChange, className }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (colors.length === 0) return null

  const selected = colors.filter((c) => value.includes(c.hex))
  const unselected = colors.filter((c) => !value.includes(c.hex))
  const sortedColors = [...selected, ...unselected]

  function toggle(hex) {
    onChange(value.includes(hex) ? value.filter((h) => h !== hex) : [...value, hex])
  }

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
          'dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200'
        )}
      >
        {selected.length > 0 ? (
          <>
            <span className="flex -space-x-1.5">
              {selected.slice(0, 4).map((c) => (
                <span
                  key={c.hex}
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/20 dark:ring-white/25 ring-offset-1 ring-offset-white dark:ring-offset-[#111]"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </span>
            <span className="whitespace-nowrap">
              {selected.length === 1 ? selected[0].name : t('colors.selectedCount', { count: selected.length })}
            </span>
          </>
        ) : (
          <span className="opacity-50">{t('colors.filterByColor')}</span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('common.clear', 'Clear')}
              onClick={(e) => { e.stopPropagation(); onChange([]) }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onChange([]) } }}
              className="opacity-40 hover:opacity-80"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} className="opacity-40" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border bg-white p-1 shadow-lg dark:bg-[#1a1a1f] dark:border-white/10 border-slate-200">
          {sortedColors.map((c, i) => {
            const on = value.includes(c.hex)
            return (
              <div key={c.hex}>
                {i === selected.length && selected.length > 0 && (
                  <div className="my-1 border-t border-black/10 dark:border-white/10" />
                )}
                <button
                  type="button"
                  onClick={() => toggle(c.hex)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10',
                    on && 'bg-black/5 dark:bg-white/10'
                  )}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/20 dark:ring-white/25"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs opacity-40 font-mono">{c.hex}</span>
                  {on && <Check size={13} className="ml-auto shrink-0 opacity-70" />}
                </button>
              </div>
            )
          })}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 flex w-full items-center justify-center rounded px-2 py-1.5 text-xs opacity-50 hover:bg-black/5 hover:opacity-90 dark:hover:bg-white/10"
            >
              {t('colors.clearFilter')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
