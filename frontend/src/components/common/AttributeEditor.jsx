import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CANONICAL_HEX_KEY, isColorHexKey, isColorKey, normalizeHex } from '@/lib/colors'

// Key/value editor for a variant's free-form `attributes` JSONB.
//
// When a row's key reads as a colour (color / renk / цвет — see lib/colors.js),
// a swatch picker appears next to the value and writes the chosen hex into a
// sibling `color_hex` entry, so lists can render the real colour rather than
// just the word for it. The hex row itself is managed by the picker and hidden
// from the pair list, so users never hand-edit it.
export function AttributeEditor({ initial = {}, onChange }) {
  const { t } = useTranslation()

  const entries = Object.entries(initial ?? {})
  const [pairs, setPairs] = useState(() => entries.filter(([k]) => !isColorHexKey(k)))
  // Hex is stored outside `pairs` so it can't be reordered or renamed by hand
  const [hex, setHex] = useState(() => {
    const found = entries.find(([k]) => isColorHexKey(k))
    return found ? normalizeHex(found[1]) : null
  })

  function emit(nextPairs, nextHex) {
    const out = Object.fromEntries(nextPairs.filter(([k]) => k.trim()))
    const hasColor = nextPairs.some(([k]) => isColorKey(k))
    if (hasColor && nextHex) out[CANONICAL_HEX_KEY] = nextHex
    onChange(out)
  }

  function push(next) {
    setPairs(next)
    emit(next, hex)
  }

  function updatePair(idx, field, v) {
    push(pairs.map((p, i) => (i === idx ? (field === 'k' ? [v, p[1]] : [p[0], v]) : p)))
  }

  // A new empty row isn't emitted until it has a key, matching the previous behaviour
  function addPair() { setPairs([...pairs, ['', '']]) }

  function removePair(idx) { push(pairs.filter((_, i) => i !== idx)) }

  function pickHex(v) {
    const next = normalizeHex(v)
    setHex(next)
    emit(pairs, next)
  }

  return (
    <div className="space-y-1.5">
      {pairs.map(([k, v], idx) => (
        <div key={idx} className="flex gap-1.5 items-center">
          <Input
            value={k}
            onChange={(e) => updatePair(idx, 'k', e.target.value)}
            placeholder={t('variants.attrKeyPlaceholder')}
            className="h-7 text-xs flex-1"
          />
          <span className="text-slate-400 text-xs shrink-0">:</span>
          <Input
            value={v}
            onChange={(e) => updatePair(idx, 'v', e.target.value)}
            placeholder={t('variants.attrValuePlaceholder')}
            className="h-7 text-xs flex-1"
          />
          {isColorKey(k) && (
            <input
              type="color"
              value={hex ?? '#000000'}
              onChange={(e) => pickHex(e.target.value)}
              title={t('variants.pickColor')}
              aria-label={t('variants.pickColor')}
              className="h-7 w-7 shrink-0 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5 dark:border-white/10"
            />
          )}
          <button
            type="button"
            onClick={() => removePair(idx)}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPair}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      >
        <Plus className="h-3 w-3" />{t('variants.addAttribute')}
      </button>
    </div>
  )
}
