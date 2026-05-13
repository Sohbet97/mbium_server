const ApiError = require("../../exceptions/api-error");
const { FUNCTIONS } = require("../../utils/functions");
const Validator = require("../../__artefacts__/_validator_");

/**
 * BaseController — generic REST controller.
 * Extend it and set `static Service`, `static schema`, and optionally
 * override `getFilter()`.
 *
 * @example
 * class ShopController extends BaseController {}
 * ShopController.Service = ShopService;
 * ShopController.schema  = shopSchema;
 */
class BaseController {
    /** @type {typeof import("./BaseService")} — set in subclass */
    static Service = null;

    /** @type {import("yup").Schema} — set in subclass */
    static schema = null;

    /** Human-readable entity name used in 404 messages */
    static entityName = "Record";

    // ─── Routes ──────────────────────────────────────────────────────────────

    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                this.Service.get(filter, limit, sort, skip, paranoid),
                this.Service.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getCount(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = await this.getFilter(req.query);
            const count = await this.Service.getCount(filter, paranoid);
            return res.status(200).json({ count });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const model = await this.Service.getById(req?.params?.id, paranoid);
            if (!model) throw ApiError.NotFound(`${this.entityName} not found`);
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(this.schema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await this.Service.create(req);
            res.status(201).json({ model });
            next();
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const existing = await this.Service.getById(req?.params?.id);
            if (!existing) throw ApiError.NotFound(`${this.entityName} not found`);

            // Merge incoming fields onto the found instance
            Object.assign(existing, this.Service.buildUpdatePayload(req));

            const { isError, errors } = await Validator.validate(this.schema, existing);
            if (isError) throw ApiError.BadRequest(null, errors);

            await existing.save();
            res.status(200).json(existing);
            next();
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await this.Service.delete(req.params.id);
            res.sendStatus(200);
            next();
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await this.Service.delete(req.params.id, true);
            res.sendStatus(200);
            next();
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) throw ApiError.BadRequest("Id parameter is required");
            const model = await this.Service.restore(id);
            if (!model) throw ApiError.NotFound(`${this.entityName} not found`);
            res.sendStatus(200);
            next();
        } catch (e) { next(e); }
    }

    // ─── Filter builder — override per entity ────────────────────────────────

    /**
     * Build a Sequelize `where` filter from query params.
     * Override in subclass to add entity-specific filters.
     * @param {object} params — req.query
     * @returns {object}
     */
    static async getFilter(params = {}) {
        return {};
    }
}

module.exports = BaseController;
