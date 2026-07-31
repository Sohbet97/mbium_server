const { Op } = require("sequelize");
const crypto = require("crypto");
const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");

class DiscountService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Discount.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["createdAt", "DESC"]],
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Discount.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Discount.findOne({
            where: { id },
            paranoid,
            include: [
                { model: db.Shop, as: "shop", attributes: ["id", "name"], required: false },
            ],
        });
    }

    static async getByCode(code) {
        return db.Discount.findOne({ where: { code, is_active: true } });
    }

    // Shop scope + validity-window + usage-limit checks shared by the buyer "validate coupon"
    // endpoint and actual checkout, so both make identical accept/reject decisions.
    static assertUsable(discount, { shopId, subtotal, quantity } = {}) {
        if (shopId != null && discount.shop_id != null && Number(discount.shop_id) !== Number(shopId)) {
            throw ApiError.NotFound("Bu kupon bu dükana degişli däl");
        }

        const now = new Date();
        if (discount.starts_at && new Date(discount.starts_at) > now) {
            throw ApiError.NotAllowed("Kupon heniz işjeň däl");
        }
        if (discount.ends_at && new Date(discount.ends_at) < now) {
            throw ApiError.NotAllowed("Kuponyň möhleti geçdi");
        }
        if (discount.max_uses != null && discount.used_count >= discount.max_uses) {
            throw ApiError.NotAllowed("Kuponyň ulanylyş çägi doldy");
        }
        if (subtotal != null && discount.min_order_amount != null && subtotal < parseFloat(discount.min_order_amount)) {
            throw ApiError.NotAllowed(`Bu kupon üçin iň az sargyt: ${discount.min_order_amount}`);
        }
        if (quantity != null && discount.min_quantity != null && quantity < discount.min_quantity) {
            throw ApiError.NotAllowed(`Bu kupon üçin iň az mukdar: ${discount.min_quantity}`);
        }
        if (discount.category === "BUY_X_GET_Y") {
            throw ApiError.BadRequest("Bu kupon görnüşi heniz goldanylmaýar");
        }
    }

    // Splits order line items into the subset a discount actually applies to, based on
    // applies_to_type/applies_to_ids (ALL | CATEGORIES | PRODUCTS). Each item needs
    // { product: { id, category_id }, quantity, total_price }.
    static getEligibleItems(discount, items) {
        if (discount.applies_to_type === "CATEGORIES") {
            const ids = (discount.applies_to_ids || []).map(Number);
            return items.filter((i) => ids.includes(Number(i.product.category_id)));
        }
        if (discount.applies_to_type === "PRODUCTS") {
            const ids = (discount.applies_to_ids || []).map(Number);
            return items.filter((i) => ids.includes(Number(i.product.id)));
        }
        return items; // ALL
    }

    // Computes the money amount to knock off, clamped to the eligible subtotal.
    static computeAmount(discount, eligibleSubtotal) {
        if (discount.category === "FREE_SHIPPING" || discount.type === "FREE_SHIPPING") return 0;
        if (eligibleSubtotal <= 0) return 0;
        const value = parseFloat(discount.value);
        const amount = discount.type === "PERCENTAGE" ? eligibleSubtotal * (value / 100) : value;
        return parseFloat(Math.min(Math.max(amount, 0), eligibleSubtotal).toFixed(2));
    }

    static async create(body) {
        const code = body.code?.trim().toUpperCase() || crypto.randomBytes(4).toString("hex").toUpperCase();
        return db.Discount.create({ ...body, code });
    }

    static async update(id, body) {
        if (body.code) body.code = body.code.trim().toUpperCase();
        await db.Discount.update(body, { where: { id } });
        return this.getById(id);
    }

    static async delete(id, force = false) {
        return db.Discount.destroy({ where: { id }, force });
    }

    static async restore(id) {
        return db.Discount.restore({ where: { id } });
    }

    static getFilter({ shop_id, is_active, code } = {}) {
        const filter = {};
        if (shop_id) filter.shop_id = shop_id;
        if (is_active !== undefined) filter.is_active = is_active === "true" || is_active === true;
        if (code) filter.code = { [Op.iLike]: `%${code}%` };
        return filter;
    }
}

module.exports = DiscountService;
