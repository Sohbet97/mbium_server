import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/common/FormField'
import { BuyerApi } from '@/lib/api'

// Region → city + district pickers for a shop. Cities and districts both belong to a region,
// so changing the region clears them. `value` holds region_id/city_id/district_id ('' when unset);
// `onChange` receives a partial patch of those three fields.
export function ShopLocationFields({ value, onChange, required = false }) {
  const { t } = useTranslation()
  const [regions, setRegions] = useState([])
  // Options are tagged with the region they were loaded for, so a stale list never shows
  const [options, setOptions] = useState({ regionId: '', cities: [], districts: [] })
  const regionId = value.region_id ? String(value.region_id) : ''
  const { cities, districts } = options.regionId === regionId ? options : { cities: [], districts: [] }

  useEffect(() => {
    BuyerApi.locations.regions({ limit: -1, sort: 'name' })
      .then(({ data }) => setRegions(data.data ?? []))
      .catch(() => setRegions([]))
  }, [])

  useEffect(() => {
    if (!regionId) return
    const params = { region: regionId, limit: -1, sort: 'name' }
    const list = (req) => req.then(({ data }) => data.data ?? []).catch(() => [])
    Promise.all([list(BuyerApi.locations.cities(params)), list(BuyerApi.locations.districts(params))])
      .then(([cities, districts]) => setOptions({ regionId, cities, districts }))
  }, [regionId])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <FormField label={t('shops.region')} required={required}>
        <Select
          value={regionId}
          onChange={(e) => onChange({ region_id: e.target.value, city_id: '', district_id: '' })}
        >
          <option value="">{t('shops.selectRegion')}</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </FormField>
      <FormField label={t('shops.city')}>
        <Select
          value={value.city_id ? String(value.city_id) : ''}
          disabled={!regionId}
          onChange={(e) => onChange({ city_id: e.target.value })}
        >
          <option value="">{t('shops.selectCity')}</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </FormField>
      <FormField label={t('shops.district')}>
        <Select
          value={value.district_id ? String(value.district_id) : ''}
          disabled={!regionId}
          onChange={(e) => onChange({ district_id: e.target.value })}
        >
          <option value="">{t('shops.selectDistrict')}</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </FormField>
    </div>
  )
}
