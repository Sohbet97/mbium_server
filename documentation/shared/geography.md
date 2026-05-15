# Geography

Global reference data for Turkmenistan's administrative hierarchy. Used by the Shop module (city_id, region_id) and will be used by delivery addresses.

**Files:** `backend/models/Country.js`, `Region.js`, `District.js`, `City.js`, `Village.js`, `Street.js`

---

## Hierarchy

```
Country
  └── Region (Welaýat / Şäher)
        └── District (Etrap / Şäher)
              └── Village (Etrapdaky şäher / Şäherçe / Geňeşlik)
                    └── Street
City  ← separate entity, linked to Region
```

---

## Admin Endpoints

All geography routes are mounted directly on the admin router (not within a module):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/country` | List countries |
| POST | `/admin/country` | Create country |
| PUT | `/admin/country/:id` | Update country |
| DELETE | `/admin/country/:id` | Delete country |
| GET | `/admin/region` | List regions |
| POST | `/admin/region` | Create region |
| PUT | `/admin/region/:id` | Update region |
| DELETE | `/admin/region/:id` | Delete region |
| GET | `/admin/districts` | List districts |
| POST | `/admin/districts` | Create district |
| PUT | `/admin/districts/:id` | Update district |
| DELETE | `/admin/districts/:id` | Delete district |
| GET | `/admin/city` | List cities |
| POST | `/admin/city` | Create city |
| PUT | `/admin/city/:id` | Update city |
| DELETE | `/admin/city/:id` | Delete city |
| GET | `/admin/village` | List villages |
| POST | `/admin/village` | Create village |
| PUT | `/admin/village/:id` | Update village |
| DELETE | `/admin/village/:id` | Delete village |

---

## Type Enumerations

**Region types** (`FUNCTIONS.regionTypes`):

| Value | Label |
|-------|-------|
| 0 | Welaýat (Province) |
| 10 | Şäher (City-level region) |

**District types** (`FUNCTIONS.districtTypes`):

| Value | Label |
|-------|-------|
| 0 | Etrap (District) |
| 10 | Şäher (Town) |

**Village types** (`FUNCTIONS.villageTypes`):

| Value | Label |
|-------|-------|
| 0 | Etrapdaky şäher (Town in district) |
| 10 | Şäherçe (Settlement) |
| 20 | Geňeşlik (Council) |

---

## Usage in Other Modules

- **Shop:** `shop.city_id → cities.id`, `shop.region_id → regions.id`
- **Delivery address (planned):** structured address model will reference city/region/district FKs
