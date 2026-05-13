const { Op } = require("sequelize");
const { FUNCTIONS } = require("../../utils/functions");
const { CONSTANTS } = require("../../config/constants");

/**
 * BaseService — generic CRUD service.
 * Extend it and set `static model` and optionally `static defaultIncludes`.
 *
 * @example
 * class ShopService extends BaseService {}
 * ShopService.model = db.Shop;
 * ShopService.defaultIncludes = [{ model: db.ShopType, as: "type", attributes: ["name"] }];
 */
class BaseService {
    /** @type {import("sequelize").Model} — set in subclass */
    static model = null;

    /** @type {Array} — sequelize include array, override in subclass */
    static defaultIncludes = [];

    /** @type {Array} — default sort order, override in subclass */
    static defaultOrder = [["createdAt", "DESC"]];

    // ─── Read ────────────────────────────────────────────────────────────────

    static async get(
        filter = {},
        limit = undefined,
        order = this.defaultOrder,
        offset = 0,
        paranoid = true
    ) {
        return this.model.findAll({
            where: filter,
            offset,
            order,
            limit,
            paranoid,
            include: this.defaultIncludes,
        });
    }

    static async getForFilter() {
        return this.get(
            { is_active: { [Op.eq]: true } },
            CONSTANTS.MAX_ROWS
        );
    }

    static async getCount(filter = {}, paranoid = true) {
        return this.model.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return this.model.findOne({
            where: { id },
            paranoid,
            include: this.defaultIncludes,
        });
    }

    // ─── Write ───────────────────────────────────────────────────────────────

    /**
     * Override `buildCreatePayload` in subclass to define which fields to pick.
     */
    static async create(req) {
        return this.model.create(this.buildCreatePayload(req));
    }

    static async update(id, req) {
        if (!id) return null;
        return this.model.update(this.buildUpdatePayload(req), { where: { id } });
    }

    static async delete(id, force = false) {
        if (!id) return;
        await this.model.destroy({ where: { id }, force });
    }

    static async restore(id) {
        if (!id) return;
        const model = await this.model.findOne({ where: { id }, paranoid: false });
        if (model?.deletedAt) await model.restore();
        return model;
    }

    // ─── Payload builders — override in subclass ──────────────────────────────

    /**
     * Extract create-safe fields from the request.
     * @param {import("express").Request} req
     * @returns {object}
     */
    static buildCreatePayload(req) {
        return { ...this.buildUpdatePayload(req), createdBy: req.user?.id };
    }

    /**
     * Extract update-safe fields from the request.
     * Subclass MUST override this (or both builders) to enumerate real fields.
     * @param {import("express").Request} req
     * @returns {object}
     */
    static buildUpdatePayload(req) {
        throw new Error(`${this.name}.buildUpdatePayload() is not implemented`);
    }
}

module.exports = BaseService;
