// Formatting helpers shared by the admin and seller ad pages

export const fmtTmt = (n) => `${Number(n ?? 0).toFixed(2)} TMT`

export function taskName(task, lang) {
  if (!task) return '—'
  if (lang === 'ru' && task.name_ru) return task.name_ru
  if (lang === 'en' && task.name_eng) return task.name_eng
  return task.name || task.code
}
