import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const LANGS = [
  { code: 'tk', flag: '🇹🇲', fieldSuffix: '' },
  { code: 'ru', flag: '🇷🇺', fieldSuffix: '_ru' },
  { code: 'en', flag: '🇬🇧', fieldSuffix: '_eng' },
]

export function MultiLangInput({ baseField, label, values, onChange, multiline = false, required = false, isAllLangsRequired = false }) {
  const Component = multiline ? Textarea : Input

  return (
    <div className="space-y-1.5">
      {LANGS.map(({ code, fieldSuffix }) => {
        const fieldName = `${baseField}${fieldSuffix}`
        return (
          <>
            <Label>{label} ({code}){required && (isAllLangsRequired || code == 'tk') && <span className="text-red-500 ml-0.5">*</span>}</Label>
            <Component
              value={values[fieldName] ?? ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              placeholder={code === 'tk' ? (required ? 'Hökman' : 'Goşmaça') : code === 'ru' ? 'Необязательно' : 'Optional'}
              rows={multiline ? 3 : undefined}
            />
          </>
        )
      })}
    </div>
  )
}
