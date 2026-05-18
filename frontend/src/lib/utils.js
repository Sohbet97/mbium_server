import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
export const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)
