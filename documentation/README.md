# mbium Server — Documentation

Backend: Node.js + Express + Sequelize + PostgreSQL
Platform: Multi-vendor marketplace for the Turkmenistan market

---

## Modules

| Module | Description | Doc |
|--------|-------------|-----|
| User | Users, roles, positions, sessions, auth | [modules/user.md](modules/user.md) |
| Shops | Shop registration, types, verification | [modules/shops.md](modules/shops.md) |
| Catalog | Products, categories, variants, images | [modules/catalog.md](modules/catalog.md) |
| Orders | Orders, cart, payments, status history | [modules/orders.md](modules/orders.md) |
| Reviews | Product reviews and moderation | [modules/reviews.md](modules/reviews.md) |
| Discounts | Coupon codes and promotions | [modules/discounts.md](modules/discounts.md) |
| Banners | Promotional banners by placement | [modules/banners.md](modules/banners.md) |

## Shared

| Topic | Description | Doc |
|-------|-------------|-----|
| Authentication | JWT, OTP, Google OAuth, sessions | [shared/authentication.md](shared/authentication.md) |
| Permissions | Full permission ID registry (1–48) | [shared/permissions.md](shared/permissions.md) |
| Geography | Country / Region / District / City / Village | [shared/geography.md](shared/geography.md) |

## Development

| Topic | Description | Doc |
|-------|-------------|-----|
| Patterns | Module structure, conventions, utilities | [development/patterns.md](development/patterns.md) |
| Roadmap | Gap analysis vs platform docs, prioritized backlog | [development/roadmap.md](development/roadmap.md) |

---

## Project Layout

```
backend/
├── __modules__/          # Feature modules (shops, catalog, orders, …)
│   └── <module>/
│       ├── models/       # Sequelize model definitions
│       ├── services/     # Data-access layer
│       ├── controllers/  # Request handlers
│       ├── routes/       # Express router
│       ├── validators/   # Yup schemas
│       └── index.js      # Module router (auth + permissions)
├── __artefacts__/        # Shared autoloaders
├── config/               # App config, constants, DB
├── exceptions/           # ApiError factory
├── middlewares/          # authorization, route-guard, upload, etc.
├── migrations/           # SQL migration files
├── models/               # Global models (User, Chat, Geo, Config…)
├── routes/               # Global routers (admin/, auth/)
└── utils/                # functions, statuses, permissions
```
