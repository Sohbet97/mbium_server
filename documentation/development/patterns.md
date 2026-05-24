# Development Patterns

Conventions followed across every feature module. Read this before adding a new module.

---

## Module File Structure

```
backend/__modules__/<name>/
├── models/
│   ├── <Model>.model.js      # Sequelize model definition
│   └── _index_.js            # Autoloader — do not manually list models here
├── services/
│   └── <name>.js             # All DB queries live here
├── controllers/
│   └── <name>.js             # Request/response handlers (no SQL)
├── routes/
│   └── <name>.js             # Express Router definitions
├── validators/
│   └── <name>.scheme.js      # Yup validation schema
└── index.js                  # Module router: auth middleware + routeGuard
```

Register the module router in `backend/routes/admin/index.js`.

---

## Model Template

```js
const { DataTypes } = require("sequelize");
const STATUSES = require("../../../utils/statuses");

module.exports = (sequelize) => {
    const Model = sequelize.define("table_name", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        // ... fields
        status: { type: DataTypes.SMALLINT, defaultValue: STATUSES.STATUSE_ACTIVE },
        createdBy: { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" } },
    }, {
        timestamps: true,   // adds createdAt / updatedAt
        paranoid: true,     // adds deletedAt — soft delete
        indexes: [{ fields: ["foreign_key_col"] }],
    });

    Model.associate = (db) => {
        // Model.belongsTo(db.OtherModel, { foreignKey: "...", as: "..." });
    };

    return Model;
};
```

The `_index_.js` autoloader (same in every module):

```js
const loadModules = require("../../../__artefacts__/models.autoloader");
module.exports = (sequelize, db) => loadModules(__dirname, ".model.js", [sequelize, db]);
```

---

## Service Template

All Sequelize queries live in the service. Controllers must not contain `db.*` calls.

```js
const { Op } = require("sequelize");
const db = require("../../../models");

class ExampleService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Example.findAll({ where: filter, offset: skip, limit, paranoid, order: [["createdAt", "DESC"]] });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Example.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Example.findOne({ where: { id }, paranoid });
    }

    static async create(body) { return db.Example.create(body); }

    static async update(id, body) {
        await db.Example.update(body, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) { return db.Example.destroy({ where: { id }, force }); }

    static async restore(id) { return db.Example.restore({ where: { id } }); }

    static getFilter({ field } = {}) {
        const filter = {};
        if (field) filter.field = { [Op.iLike]: `%${field}%` };
        return filter;
    }
}

module.exports = ExampleService;
```

---

## Controller Template

```js
const ApiError = require("../../../exceptions/api-error");
const { FUNCTIONS } = require("../../../utils/functions");
const ExampleService = require("../services/example");

class ExampleController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = ExampleService.getFilter(req.query);
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                ExampleService.get(filter, limit, skip, paranoid),
                ExampleService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const model = await ExampleService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Record not found");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const model = await ExampleService.create(req.body);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await ExampleService.getById(req.params.id);
            if (!existing) throw ApiError.NotFound("Record not found");
            const model = await ExampleService.update(req.params.id, req.body);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await ExampleService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await ExampleService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            await ExampleService.restore(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }
}

module.exports = ExampleController;
```

---

## Route Template

```js
const ExampleController = require("../controllers/example");
const router = require("express").Router();

router.get("/", ExampleController.get.bind(ExampleController));
router.get("/:id", ExampleController.getById.bind(ExampleController));
router.post("/", ExampleController.create.bind(ExampleController));
router.put("/:id", ExampleController.update.bind(ExampleController));
router.delete("/:id", ExampleController.delete.bind(ExampleController));
router.delete("/:id/force", ExampleController.forceDelete.bind(ExampleController));
router.post("/:id/restore", ExampleController.restore.bind(ExampleController));

module.exports = router;
```

---

## Module Index Template

```js
const authorizationMiddleware = require("../../middlewares/authorization-middleware");
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const exampleRouter = require("./routes/example");

const moduleRouter = require("express").Router();

moduleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET: Permissions.EXAMPLE_GET,
        POST: Permissions.EXAMPLE_POST,
        PUT: Permissions.EXAMPLE_PUT,
        DELETE: Permissions.EXAMPLE_DELETE,
    })
);

moduleRouter.use("/examples", exampleRouter);
module.exports = moduleRouter;
```

---

## Validator Template (Yup)

Error messages are written in Turkmen.

```js
const yup = require("yup");

const exampleSchema = yup.object().shape({
    name: yup.string().required("Adyny giriziň").max(255, "255 harpdan uzyn bolmaly däl"),
    is_active: yup.boolean().typeError("Aktiwlik görnüşi nädogry").optional(),
    order: yup.number().integer().max(1000).nullable(true).optional(),
});

module.exports = exampleSchema;
```

---

## Key Utilities

### `FUNCTIONS.getQueryParams(req)`
**File:** `backend/utils/functions.js`

Parses `?page`, `?limit`, `?sort` from the request query.

```js
const { limit, skip, sort, page } = FUNCTIONS.getQueryParams(req);
// limit: number (default 20, 0 = no limit)
// skip: offset for pagination
// sort: [[field, "ASC"|"DESC"]]
// page: current page number
```

Sort direction: prefix field name with `-` for DESC (e.g., `?sort=-createdAt`).

### `ApiError` factory
**File:** `backend/exceptions/api-error.js`

| Method | HTTP | Usage |
|--------|------|-------|
| `ApiError.NotFound(msg)` | 404 | Record does not exist |
| `ApiError.BadRequest(msg, errors)` | 400 | Validation failure |
| `ApiError.UnauthorizedError()` | 401 | Missing/invalid token |
| `ApiError.NotAllowed(msg)` | 403 | Insufficient permissions |
| `ApiError.Conflict(msg)` | 409 | Duplicate / constraint violation |

### `paranoid` query flag

Append `?paranoid=true` to any GET request to include soft-deleted records in the response.

Default: only non-deleted records are returned.

---

## Swagger / OpenAPI Docs

The API spec is assembled in `backend/swagger/index.js` by merging path files and a shared component file.

```
backend/swagger/
├── index.js           # Merges all paths + tags + server info into one spec object
├── components.js      # Shared schemas (ErrorResponse, PaginatedResponse, model schemas) + securitySchemes
└── paths/
    └── <resource>.js  # Path definitions for one resource group
```

### Adding a new resource

**Step 1 — Create `backend/swagger/paths/<resource>.js`**

```js
const tag      = "Widgets";                    // matches the tag name registered in index.js
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/widgets": {
        get: {
            tags: [tag], summary: "List widgets", security,
            parameters: [
                { in: "query", name: "text",  schema: { type: "string" } },
                { in: "query", name: "limit", schema: { type: "integer" } },
                { in: "query", name: "skip",  schema: { type: "integer" } },
            ],
            responses: {
                200: {
                    description: "Paginated widget list",
                    content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            data:  { type: "array", items: { $ref: "#/components/schemas/Widget" } },
                            count: { type: "integer" },
                        },
                    }}},
                },
            },
        },
        post: {
            tags: [tag], summary: "Create widget", security,
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WidgetRequest" } } } },
            responses: {
                201: { description: "Created", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Widget" } } } } } },
                400: { description: "Validation error" },
            },
        },
    },
    "/admin/widgets/{id}": {
        get: {
            tags: [tag], summary: "Get widget by ID", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                200: { description: "Widget", content: { "application/json": { schema: { type: "object", properties: { model: { $ref: "#/components/schemas/Widget" } } } } } },
                404: { description: "Not found" },
            },
        },
        put: {
            tags: [tag], summary: "Update widget", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WidgetRequest" } } } },
            responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [tag], summary: "Soft-delete widget", security,
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: { 200: { description: "Deleted" } },
        },
    },
    "/admin/widgets/{id}/force":   { delete: { tags: [tag], summary: "Permanently delete",  security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Deleted permanently" } } } },
    "/admin/widgets/{id}/restore": { patch:  { tags: [tag], summary: "Restore soft-deleted", security, parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Restored" } } } },
};
```

**Step 2 — Add schemas to `backend/swagger/components.js`**

Add both the response shape and the write shape (request body):

```js
// backend/swagger/components.js — inside schemas: { ... }

Widget: {
    type: "object",
    properties: {
        id:         { type: "integer" },
        name:       { type: "string" },
        is_active:  { type: "boolean" },
        createdAt:  { type: "string", format: "date-time" },
    },
},
WidgetRequest: {
    type: "object",
    required: ["name"],
    properties: {
        name:      { type: "string", example: "My Widget" },
        is_active: { type: "boolean", example: true },
    },
},
```

**Step 3 — Register in `backend/swagger/index.js`**

Two additions — the tag and the path spread:

```js
// 1. Import at the top
const widgetsPaths = require("./paths/widgets");

// 2. Add tag to the tags array
{ name: "Widgets", description: "Widget management" },

// 3. Spread paths into the paths object
paths: {
    // ...existing...
    ...widgetsPaths,
}
```

### Sub-action endpoints (non-CRUD verbs)

For actions like `/verify`, `/reject`, `/publish` that don't fit the CRUD template:

```js
"/admin/widgets/{id}/publish": {
    patch: {
        tags: [tag], summary: "Publish widget", security,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Published" }, 404: { description: "Not found" } },
    },
},
```

### Reusable response patterns

| Pattern | Usage |
|---------|-------|
| `$ref: "#/components/schemas/PaginatedResponse"` | `{ data: [], count: N }` list responses |
| `$ref: "#/components/schemas/ErrorResponse"` | 400 / 404 / 403 error bodies |
| `security: [{ BearerAuth: [] }]` | Apply to every protected route |

---

## Logging System

Two complementary loggers run on every authenticated admin request. Both use `res.on('finish')` — they never block the request pipeline.

| Layer | Middleware | Table | Purpose |
|-------|-----------|-------|---------|
| HTTP | `logger-middleware.js` | `logs` | Raw method / path / body / status / userId — debugging |
| Semantic | `audit-middleware.js` | `audit_logs` | Entity-aware who-did-what — accountability |

Both are registered in `backend/routes/admin/index.js` immediately after `authorizationMiddleware`:

```js
adminRouter.use(authorizationMiddleware)
adminRouter.use(loggerMiddleware)   // raw HTTP log
adminRouter.use(auditMiddleware)    // semantic audit
```

### Automatic Audit Coverage

`audit-middleware.js` intercepts every `POST / PUT / PATCH / DELETE` on admin routes and derives `entity_type`, `entity_id`, and `action` from the URL. No code changes are needed in controllers or services for standard CRUD.

A logged row looks like:

```
entity_type: "Shop"
entity_id:   "42"
action:      "VERIFY"
actor_id:    "uuid-of-admin"
ip_address:  "82.x.x.x"
description: "Jane Doe verified Shop #42"
createdAt:   2026-05-24T00:00:00Z
```

### Adding a New Entity to Audit Coverage

When a new module is created, add one or more rules to the `RULES` array in `backend/middlewares/audit-middleware.js`. Sub-action patterns must appear **before** the generic `/:id` rule for the same prefix.

```js
// backend/middlewares/audit-middleware.js — RULES array

// Sub-action first (more specific):
{ pattern: /\/admin\/widgets\/(\d+)\/(publish|archive)/i,
  entity_type: "Widget",
  getEntityId: (m) => m[1],
  getAction:   (m) => m[2].toUpperCase() },   // PUBLISH | ARCHIVE

// Generic CRUD second:
{ pattern: /\/admin\/widgets(?:\/(\d+))?/i,
  entity_type: "Widget",
  getEntityId: (m) => m[1] || null,
  getAction:   (m, req) => METHOD_ACTION[req.method] },  // CREATE | UPDATE | DELETE
```

`METHOD_ACTION` maps `POST → CREATE`, `PUT/PATCH → UPDATE`, `DELETE → DELETE`.

### Manual Audit Entry

For logic that runs outside the normal request cycle (cron jobs, background workers, internal service calls) use `AuditService.log()` directly:

```js
const AuditService = require("../../__modules__/audit/services/AuditService");

await AuditService.log({
    entity_type: "SystemDump",
    entity_id:   String(dump.id),
    action:      "CREATE",
    actor_id:    null,          // null = system/automated
    ip_address:  null,
    description: "Automated daily database dump created",
});
```

`AuditService.log()` swallows all errors internally — it is always safe to call without a try/catch.

### Audit Permissions

| Permission | ID | Grants |
|---|---|---|
| `AUDIT_GET` | 310 | Read `/admin/audit-logs` |
| `LOG_GET` | 93 | Read `/admin/log` (raw HTTP logs) |
| `LOG_DELETE` | 94 | Delete entries from `/admin/log` |

---

## Adding a New Module — Checklist

1. Create `backend/__modules__/<name>/` with the full file structure above
2. Add permission constants to `backend/utils/permissions.js` (next available IDs)
3. Register the module router in `backend/routes/admin/index.js`
4. Write a SQL migration file in `backend/migrations/` (next numbered file)
5. Run the migration against the database
6. Add audit coverage: append rules for the new entity to the `RULES` array in `backend/middlewares/audit-middleware.js`
7. Register permissions in the Roles UI: add a new entry to the `PERM_GROUPS` array in `frontend/src/pages/admin/RolesPage.jsx`

   ```js
   // frontend/src/pages/admin/RolesPage.jsx — PERM_GROUPS array
   { label: 'Widgets', perms: [EXAMPLE_GET, EXAMPLE_POST, EXAMPLE_PUT, EXAMPLE_DELETE] },
   ```

   Column order is always `[GET, POST, PUT, DELETE]` (Read / Create / Edit / Delete).
   Use `null` for any action that has no corresponding permission:

   ```js
   { label: 'Audit Logs', perms: [310, null, null, null] },  // read-only
   ```

8. Register Swagger docs (see **Swagger / OpenAPI Docs** section above):
   - Create `backend/swagger/paths/<resource>.js`
   - Add `<Resource>` and `<Resource>Request` schemas to `backend/swagger/components.js`
   - Import the paths file and add a tag entry in `backend/swagger/index.js`

9. Test: `GET /admin/<resource>` returns `{ data: [], count: 0 }`
10. Test: `POST /admin/<resource>` followed by `GET /admin/audit-logs` shows the new entry
