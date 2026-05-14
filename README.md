# mbium Server

Backend API server for the **mbium** marketplace platform, built with Node.js, Express, Sequelize, and PostgreSQL.

---

## Tech Stack

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
| Cache | Redis 5 |
| Logging | Morgan + custom Logger |

---

## Project Structure

```
mbium_server/
├── backend/
│   ├── __artefacts__/          # Base classes (BaseController, BaseService, BaseModel, BaseRouter)
│   ├── __modules__/            # Self-contained feature modules
│   │   ├── shops/              # Shops & shop types
│   │   └── user/               # Users, roles, positions, notes
│   ├── config/                 # App bootstrap (app.js) and constants
│   ├── controllers/            # Core controllers (geo, config, logs, system dumps)
│   ├── middlewares/            # Auth, RBAC, error handling, logging, cookies
│   ├── models/                 # Core Sequelize models (Country, Region, Config, Log, …)
│   ├── routes/
│   │   ├── admin/              # Admin-only routes
│   │   └── auth/               # Authentication routes
│   ├── services/               # Business logic (cities, regions, countries, …)
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
- Redis (optional — currently disabled)
- RabbitMQ (optional)

### Installation

```bash
cd backend
npm install
```

### Environment variables

Create a `.env` file in `backend/`:

```env
PORT=8811
SESSION_SECRET=your_secret_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mbium
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret

# Optional
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
ELASTICSEARCH_URL=http://localhost:9200
```

### Run

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
