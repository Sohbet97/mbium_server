import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const TIER_LABELS = { 0: 'Garaşylýar', 1: 'Standard Seller', 2: 'Verified PRO' }
const VERIFICATION_LABELS = { 0: 'Barlanmadyk', 1: 'Garaşylýar', 2: 'Tassyklanan', 3: 'Ret edildi' }

export default function SellerShopPage() {
  const [shop, setShop] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    SellerApi.shop.get()
      .then(({ data }) => {
        setShop(data.model)
        setForm({
          name:           data.model.name ?? '',
          name_ru:        data.model.name_ru ?? '',
          name_eng:       data.model.name_eng ?? '',
          description_tm: data.model.description_tm ?? '',
          description_ru: data.model.description_ru ?? '',
          description_en: data.model.description_en ?? '',
          phone:          data.model.phone ?? '',
          email:          data.model.email ?? '',
          address:        data.model.address ?? '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await SellerApi.shop.update(form)
      setShop(data.model)
      toast.success('Dükan maglumatlary ýatda saklandy')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setSaving(false)
    }
  }

  const field = (key) => ({
    value: form[key] ?? '',
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status badges */}
      <div className="flex gap-3 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
          {TIER_LABELS[shop?.seller_tier ?? 0]}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
          {VERIFICATION_LABELS[shop?.verification_status ?? 0]}
        </span>
        {shop?.verification_note && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
            Sebäp: {shop.verification_note}
          </span>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Dükan maglumatlary</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Ady (TM)</Label>
                <Input {...field('name')} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ady (RU)</Label>
                <Input {...field('name_ru')} />
              </div>
              <div className="space-y-1.5">
                <Label>Ady (EN)</Label>
                <Input {...field('name_eng')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Beýany (TM)</Label>
                <Textarea {...field('description_tm')} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Beýany (RU)</Label>
                <Textarea {...field('description_ru')} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Beýany (EN)</Label>
                <Textarea {...field('description_en')} rows={3} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input {...field('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...field('email')} type="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Salgy</Label>
              <Input {...field('address')} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saklanyp dur...' : 'Ýatda sakla'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
