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

## Adding a New Module — Checklist

1. Create `backend/__modules__/<name>/` with the full file structure above
2. Add permission constants to `backend/utils/permissions.js` (next available IDs)
3. Register the module router in `backend/routes/admin/index.js`
4. Write a SQL migration file in `backend/migrations/` (next numbered file)
5. Run the migration against the database
6. Test: `GET /admin/<resource>` returns `{ data: [], count: 0 }`
