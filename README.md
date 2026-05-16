# mbium Server

Full-stack marketplace platform — React admin frontend + Node.js/Express backend API.

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| UI components | Radix UI |
| Routing | React Router 7 |
| HTTP client | Axios |
| i18n | i18next (en / ru / tk) |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| ORM | Sequelize 6 |
| Database | PostgreSQL |
| Real-time | Socket.IO 4 |
| Auth | JWT + OTP sessions |
| Access control | RBAC middleware |
| Validation | Yup |
| API docs | Swagger UI (`/api-docs`) |
| Scheduler | node-cron |
| Message broker | RabbitMQ (amqplib) |
| Search | Elasticsearch 8 |
| Logging | Morgan + custom Logger |

---

## Project Structure

```
mbium_server/
├── frontend/
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   ├── components/
│   │   │   ├── common/         # Shared components
│   │   │   ├── layout/         # Layout components (sidebar, header, …)
│   │   │   └── ui/             # Low-level UI primitives (Radix-based)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── i18n/               # i18next setup + locale files (en, ru, tk)
│   │   ├── lib/                # Utilities and helpers
│   │   ├── pages/
│   │   │   ├── admin/          # Dashboard, Categories, Discounts, Orders,
│   │   │   │                   #   Products, Reviews, Roles, Shops, Users
│   │   │   └── auth/           # Login
│   │   └── store/              # Global state
│   ├── index.html
│   └── vite.config.js
├── backend/
│   ├── __artefacts__/          # Base classes (BaseController, BaseService, BaseModel, BaseRouter)
│   ├── __modules__/            # Self-contained feature modules
│   │   ├── banners/
│   │   ├── catalog/
│   │   ├── discounts/
│   │   ├── disputes/
│   │   ├── orders/
│   │   ├── payouts/
│   │   ├── reviews/
│   │   ├── shops/
│   │   └── user/
│   ├── config/                 # App bootstrap (app.js) and constants
│   ├── controllers/            # Core controllers (geo, config, logs, system dumps)
│   ├── dtos/                   # Data transfer objects
│   ├── middlewares/            # Auth, RBAC, error handling, logging, cookies
│   ├── migrations/             # Sequelize migrations
│   ├── models/                 # Core Sequelize models (Country, Region, Config, Log, …)
│   ├── routes/
│   │   ├── admin/              # Admin-only routes
│   │   └── auth/               # Authentication routes
│   ├── seeders/                # Database seeders
│   ├── services/               # Business logic (cities, regions, countries, …)
│   ├── swagger/                # OpenAPI/Swagger configuration
│   ├── utils/                  # Shared utilities
│   ├── exceptions/             # ApiError class
│   ├── logger/                 # Structured logger
│   └── index.js                # Entry point — HTTP server + Socket.IO
└── files/                      # Planning docs and diagrams
```

### Module conventions (`__modules__/<name>/`)

Each feature module follows the same layout:

```
index.js          ← registers routes with Express
controllers/
models/
routes/
services/
validators/
utils/
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL
- RabbitMQ (optional)
- Elasticsearch (optional)

---

### Frontend

```bash
cd frontend
npm install
npm run dev        # dev server (Vite HMR)
npm run build      # production build → dist/
npm run preview    # preview production build
```

The dev server starts on **http://localhost:5173** by default.

---

### Backend

#### Installation

```bash
cd backend
npm install
```

#### Environment variables

Copy the example file and fill in your values:

```bash
cp env.example .env
```

```env
PORT=8811
SESSION_SECRET=your_secret_here
EXTERNAL_SECRET=your_external_secret
DUMP_ENCRYPT_PASSWORD=your_dump_password

# Database
DB_HOST=localhost
DB_NAME=mbium
DB_USERNAME=postgres
DB_PASSWORD=password

# JWT
ACCESS_TOKEN=your_access_token_secret
REFRESH_TOKEN=your_refresh_token_secret
ACCESS_TOKEN_EXPIRE_TIME=15m
REFRESH_TOKEN_EXPIRE_TIME=2d
REFRESH_TOKEN_EXPIRE_TIME_MILLISECONDS=172800000

# Optional
RABBITMQ_URL=amqp://localhost
ELASTICSEARCH_URL=http://localhost:9200
```

#### Database setup

```bash
# Run migrations
npx sequelize-cli db:migrate

# (Optional) Seed initial data
npm run seed
```

#### Run

```bash
# Development (nodemon auto-reload)
npm start

# Tests
npm test
```

The server starts on **port 8811** by default.

---

## API

| Base path | Description |
|---|---|
| `POST /auth/*` | Authentication (login, OTP, token refresh) |
| `GET/POST/… /admin/*` | Admin-protected REST endpoints |
| `/api-docs` | Swagger UI (interactive documentation) |
| `/api-docs.json` | Raw OpenAPI spec |
| `/static/*` | Static file serving (`public/` folder) |

### Real-time (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `join` | client → server | Register user presence (`{ id }`) |
| `online-users` | server → all | Updated list of online user IDs |
| `disconnect` | client → server | Removes user from presence map |

---

## Base classes

The `__artefacts__/base/` folder provides generic classes that modules extend:

- **BaseController** — `get`, `getById`, `getCount`, `create`, `update`, `delete`, `forceDelete`, `restore`. Override `getFilter(params)` for entity-specific filtering.
- **BaseService** — CRUD operations over a Sequelize model.
- **BaseModel** — Sequelize model with common fields and soft-delete.
- **createBaseRouter** — Wires `BaseController` methods to standard REST routes.

---

## CORS

Allowed origins are configured in [backend/config/app.js](backend/config/app.js):

```js
var allowlist = [
  "http://localhost:3000"
];
```

Update this list to match your frontend origin(s).

---

## License

ISC
