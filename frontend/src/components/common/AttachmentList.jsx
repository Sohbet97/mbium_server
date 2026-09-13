import { FileSpreadsheet, FileText, FileVideo, Paperclip } from 'lucide-react'
import { absUrl } from '@/lib/utils'

const FILE_ICONS = {
  EXCEL: FileSpreadsheet,
  WORD:  FileText,
  PDF:   FileText,
  VIDEO: FileVideo,
}

// Renders a buyer-request/offer `attachments` array: image thumbnails inline,
// everything else (video/excel/word/pdf) as an icon + filename link that opens
// in a new tab.
export function AttachmentList({ attachments, className = '' }) {
  if (!attachments?.length) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {attachments.map((att) => {
        const url = absUrl(att.url)
        if (att.file_type === 'IMAGE') {
          return (
            <a key={att.id ?? url} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border dark:border-white/10">
              <img src={url} alt={att.original_name || ''} className="h-full w-full object-cover" />
            </a>
          )
        }
        const Icon = FILE_ICONS[att.file_type] || Paperclip
        return (
          <a
            key={att.id ?? url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs text-slate-600 hover:bg-black/[0.02] dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.03]"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[10rem] truncate">{att.original_name || url.split('/').pop()}</span>
          </a>
        )
      })}
    </div>
  )
}
