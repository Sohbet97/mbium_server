// '' → null for the API
export const locationPayload = (f) => ({
  region_id: f.region_id ? Number(f.region_id) : null,
  city_id: f.city_id ? Number(f.city_id) : null,
  district_id: f.district_id ? Number(f.district_id) : null,
})
