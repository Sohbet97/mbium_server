import { useRef, useState } from 'react'
import { Paperclip, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

// Lets the user pick one or more files, uploads each via `onUpload` (expected to
// resolve to { url, file_type, mime_type, original_name, size }), and keeps the
// resulting attachment list in sync with the parent via `value`/`onChange`.
export function AttachmentPicker({ value = [], onChange, onUpload, accept, disabled }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await onUpload(formData)
        uploaded.push(data)
      }
      onChange([...value, ...uploaded])
    } finally {
      setUploading(false)
    }
  }

  function remove(idx) {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" multiple hidden accept={accept} onChange={handleFiles} />
      <Button type="button" size="sm" variant="outline" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Paperclip className="h-4 w-4 mr-1" />}
        {t('common.attachFiles', 'Attach files')}
      </Button>

      {!!value.length && (
        <div className="flex flex-wrap gap-2">
          {value.map((att, idx) => (
            <span key={att.url + idx} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs dark:border-white/10">
              <span className="max-w-[8rem] truncate">{att.original_name || att.url.split('/').pop()}</span>
              <button type="button" onClick={() => remove(idx)} className="text-slate-400 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
