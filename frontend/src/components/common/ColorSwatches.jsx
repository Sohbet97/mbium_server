import { extractColors } from '@/lib/colors'
import { cn } from '@/lib/utils'

// Renders a product's distinct colours as small dots.
//
// Pass `product` to cover its own colour plus its variants', or `variants` for
// just a list of rows. Rows without a colour produce nothing at all, so this is
// safe to drop anywhere — plenty of products have no colour.
//
// A colour with a label but no hex falls back to a dashed outline dot; the
// label is always in the tooltip, so nothing is lost when the hex is missing.
export function ColorSwatches({ product, variants, max = 4, className }) {
  const rows = product ? [product, ...(product.variants ?? [])] : variants
  const colors = extractColors(rows)
  if (colors.length === 0) return null

  const shown = colors.slice(0, max)
  const extra = colors.length - shown.length

  return (
    <span className={cn('inline-flex items-center gap-1 align-middle', className)}>
      {shown.map(({ label, hex }) => (
        <span
          key={label}
          title={label}
          aria-label={label}
          className={cn(
            'w-3 h-3 rounded-full shrink-0 ring-1 ring-inset',
            hex ? 'ring-black/20 dark:ring-white/25' : 'border border-dashed border-current opacity-50'
          )}
          style={hex ? { backgroundColor: hex } : undefined}
        />
      ))}
      {extra > 0 && (
        <span className="text-[10px] leading-none opacity-50" title={colors.slice(max).map((c) => c.label).join(', ')}>
          +{extra}
        </span>
      )}
    </span>
  )
}
