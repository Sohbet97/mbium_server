const { Op, literal } = require("sequelize");
const { buildTsQuery } = require("../../../services/search");
const ApiError = require("../../../exceptions/api-error");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const Validator = require("../../../__artefacts__/_validator_");
const CategoryService = require("../services/categories");
const categorySchema = require("../validators/category.schema");

class CategoryController {
    static async get(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const filter = this.getFilter(req.query);
            const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
            const [data, count] = await Promise.all([
                CategoryService.get(filter, limit, sort, skip, paranoid),
                CategoryService.getCount(filter, paranoid),
            ]);
            return res.status(200).json({ data, count });
        } catch (e) { next(e); }
    }

    static async getTree(req, res, next) {
        try {
            const data = await CategoryService.getTree();
            return res.status(200).json({ data });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const paranoid = !req.query?.paranoid;
            const model = await CategoryService.getById(req.params.id, paranoid);
            if (!model) throw ApiError.NotFound("Kategoriýa tapylmady");
            return res.status(200).json({ model });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(categorySchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            const model = await CategoryService.create(req);
            return res.status(201).json({ model });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const model = await CategoryService.getById(req.params.id);
            if (!model) throw ApiError.NotFound("Kategoriýa tapylmady");
            const { isError, errors } = await Validator.validate(categorySchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);
            await CategoryService.update(req.params.id, req);
            return res.status(200).json({ ok: true });
        } catch (e) { next(e); }
    }

    static async delete(req, res, next) {
        try {
            await CategoryService.delete(req.params.id);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async forceDelete(req, res, next) {
        try {
            await CategoryService.delete(req.params.id, true);
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static async restore(req, res, next) {
        try {
            const model = await db.Category.findOne({ where: { id: req.params.id }, paranoid: false });
            if (!model) throw ApiError.NotFound("Kategoriýa tapylmady");
            if (model.deletedAt) await model.restore();
            return res.sendStatus(200);
        } catch (e) { next(e); }
    }

    static getFilter({ text, status, parent_id, paranoid } = {}) {
        const filter = {};
        if (text) {
            const q = buildTsQuery(text)
            if (q) {
                filter[Op.and] = [literal(
                    `to_tsvector('simple',
                       COALESCE(name,'') || ' ' || COALESCE(name_ru,'') || ' ' ||
                       COALESCE(name_eng,'')
                     ) @@ to_tsquery('simple', '${q.replace(/'/g, "''")}')`
                )]
            } else {
                filter[Op.or] = [
                    { name:     { [Op.iLike]: `%${text}%` } },
                    { name_ru:  { [Op.iLike]: `%${text}%` } },
                    { name_eng: { [Op.iLike]: `%${text}%` } },
                ]
            }
        }
        if (status !== undefined) filter.status = status;
        if (parent_id !== undefined) filter.parent_id = parent_id === "null" ? null : parent_id;
        if (paranoid) filter.deletedAt = { [Op.ne]: null };
        return filter;
    }
}

module.exports = CategoryController;
