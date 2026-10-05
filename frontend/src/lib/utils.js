import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
export const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

// Localized banner placement name: name = Turkmen, name_ru, name_eng. Falls back across languages.
export const bannerTypeName = (tp, lang) => {
  if (!tp) return ''
  const l = (lang || 'en').slice(0, 2)
  const byLang = l === 'tk' ? tp.name : l === 'ru' ? tp.name_ru : tp.name_eng
  return byLang || tp.name_eng || tp.name || ''
}
