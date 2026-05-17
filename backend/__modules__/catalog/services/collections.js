const { Op } = require("sequelize");
const db = require("../../../models");

class CollectionService {
    static async get(filter = {}, limit, skip = 0, paranoid = true) {
        return db.Collection.findAll({
            where: filter,
            offset: skip,
            limit,
            paranoid,
            order: [["sort_order", "ASC"], ["createdAt", "DESC"]],
            attributes: {
                include: [
                    [
                        db.sequelize.literal(
                            `(SELECT COUNT(*) FROM "collection_products" WHERE "collection_products"."collection_id" = "collections"."id")`
                        ),
                        "product_count",
                    ],
                ],
            },
        });
    }

    static async getCount(filter = {}, paranoid = true) {
        return db.Collection.count({ where: filter, paranoid });
    }

    static async getById(id, paranoid = true) {
        if (!id) return null;
        return db.Collection.findOne({
            where: { id },
            paranoid,
            include: [
                {
                    model: db.Product,
                    as: "products",
                    through: { attributes: ["id", "sort_order"] },
                    include: [
                        { model: db.ProductImage, as: "images", where: { is_primary: true }, required: false },
                    ],
                },
            ],
        });
    }

    static async create(data) {
        return db.Collection.create({
            name:            data.name,
            name_ru:         data.name_ru,
            name_eng:        data.name_eng,
            description:     data.description,
            image_url:       data.image_url,
            handle:          data.handle,
            seo_title:       data.seo_title,
            seo_description: data.seo_description,
            sort_order:      data.sort_order ?? 0,
            is_active:       data.is_active ?? true,
        });
    }

    static async update(id, data) {
        return db.Collection.update(
            {
                name:            data.name,
                name_ru:         data.name_ru,
                name_eng:        data.name_eng,
                description:     data.description,
                image_url:       data.image_url,
                handle:          data.handle,
                seo_title:       data.seo_title,
                seo_description: data.seo_description,
                sort_order:      data.sort_order,
                is_active:       data.is_active,
            },
            { where: { id } }
        );
    }

    static async delete(id, force = false) {
        return db.Collection.destroy({ where: { id }, force });
    }

    // ── Products ────────────────────────────────────────────────────────────────

    static async addProduct(collectionId, productId, sortOrder = 0) {
        const [entry] = await db.CollectionProduct.findOrCreate({
            where: { collection_id: collectionId, product_id: productId },
            defaults: { sort_order: sortOrder },
        });
        return entry;
    }

    static async removeProduct(collectionId, productId) {
        return db.CollectionProduct.destroy({
            where: { collection_id: collectionId, product_id: productId },
        });
    }

    static async searchProducts(query, collectionId, limit = 20) {
        const filter = {};
        if (query) {
            filter[Op.or] = [
                { name:    { [Op.iLike]: `%${query}%` } },
                { name_ru: { [Op.iLike]: `%${query}%` } },
                { sku:     { [Op.iLike]: `%${query}%` } },
            ];
        }
        return db.Product.findAll({
            where: filter,
            limit,
            include: [
                { model: db.ProductImage, as: "images", where: { is_primary: true }, required: false },
            ],
            attributes: ["id", "name", "name_ru", "price", "currency", "sku", "stock"],
        });
    }
}

module.exports = CollectionService;
