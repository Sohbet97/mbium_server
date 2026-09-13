const { Op, QueryTypes } = require("sequelize");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const { CONSTANTS } = require("../../../config/constants");
const SHOP_CONSTANTS = require("../utils/constants");
const NotificationService = require("../../../services/notifications");
const PushService         = require("../../../services/push");
const ApiError             = require("../../../exceptions/api-error");

class ShopService {
  // A shop's blue check is a plan grant (plans.verified_badge) OR the KYC
  // is_verified flag — callers shouldn't have to combine the two themselves.
  static _withBlueBadge(shop) {
    if (!shop) return shop;
    shop.setDataValue("has_blue_badge", Boolean(shop.plan?.verified_badge || shop.is_verified));
    return shop;
  }

  static async get(filter = {}, limit = undefined, order = SHOP_CONSTANTS.DEFAULT_SORT, offset = 0, paranoid = true) {
    const shops = await db.Shop.findAll({
      where: filter,
      offset,
      order,
      limit,
      paranoid,
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name"] },
        { model: db.User, as: "owner", attributes: ["id", "name", "surname", "phone_number"], required: false },
        ...(db.Plan ? [{ model: db.Plan, as: "plan", attributes: ["id", "verified_badge"], required: false }] : []),
      ],
    });
    return shops.map((shop) => this._withBlueBadge(shop));
  }

  // Top shops by rating (ties broken by order count), with the aggregates the
  // mobile "top sellers" screen needs. Raw SQL — these are per-row subquery
  // counts across favorites/orders/reels/comments, not a plain Sequelize include.
  static async getTop(limit = 20) {
    return db.sequelize.query(
      `SELECT s.id, s.name, s.logo, COALESCE(s.rating, 0)::float AS rating,
              (SELECT COUNT(*)::int FROM products p WHERE p.shop_id = s.id AND p."deletedAt" IS NULL) AS total_products,
              (SELECT COUNT(*)::int FROM orders o WHERE o.shop_id = s.id AND o."deletedAt" IS NULL) AS total_orders,
              (SELECT COUNT(*)::int FROM favorites f
                 JOIN products p2 ON p2.id = f.product_id
                 WHERE p2.shop_id = s.id) AS total_product_favorites,
              (SELECT COUNT(*)::int FROM reels r WHERE r.shop_id = s.id AND r."deletedAt" IS NULL) AS total_reels,
              (SELECT COUNT(*)::int FROM comments c
                 JOIN products p3 ON p3.id = c.product_id
                 WHERE p3.shop_id = s.id) AS total_comments
       FROM shops s
       WHERE s."deletedAt" IS NULL AND s.is_active = true
       ORDER BY COALESCE(s.rating, 0) DESC, total_orders DESC
       LIMIT :limit`,
      { replacements: { limit }, type: QueryTypes.SELECT }
    );
  }

  static async getForFilter() {
    return this.get({ is_active: { [Op.eq]: true } }, CONSTANTS.MAX_ROWS);
  }

  static async getCount(filter = {}, paranoid = true) {
    return db.Shop.count({ where: filter, paranoid });
  }

  static async getById(id, paranoid = true) {
    if (!id) return;
    const shop = await db.Shop.findOne({
      where: { id },
      paranoid,
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name"] },
        { model: db.User, as: "owner", attributes: ["id", "name", "surname", "phone_number", "email", "status"] },
        ...(db.Category ? [{ model: db.Category, as: "categories", through: { attributes: [] } }] : []),
        ...(db.DeliveryType ? [{ model: db.DeliveryType, as: "deliveryTypes", through: { attributes: [] } }] : []),
        ...(db.Brand ? [{ model: db.Brand, as: "brands", through: { attributes: [] } }] : []),
        ...(db.Plan ? [{ model: db.Plan, as: "plan", attributes: ["id", "verified_badge"], required: false }] : []),
      ],
    });
    return this._withBlueBadge(shop);
  }

  static async getByOwner(userId) {
    if (!userId) return null;
    const shop = await db.Shop.findOne({
      where: { owner_id: userId },
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name"] },
        ...(db.Category ? [{ model: db.Category, as: "categories", through: { attributes: [] } }] : []),
        ...(db.DeliveryType ? [{ model: db.DeliveryType, as: "deliveryTypes", through: { attributes: [] } }] : []),
        ...(db.Brand ? [{ model: db.Brand, as: "brands", through: { attributes: [] } }] : []),
        ...(db.Plan ? [{ model: db.Plan, as: "plan", attributes: ["id", "verified_badge"], required: false }] : []),
      ],
    });
    return this._withBlueBadge(shop);
  }

  static async getAllByOwner(userId) {
    if (!userId) return [];
    const shops = await db.Shop.findAll({
      where: { owner_id: userId },
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name"] },
        ...(db.Plan ? [{ model: db.Plan, as: "plan", attributes: ["id", "verified_badge"], required: false }] : []),
      ],
      order: [["is_active", "DESC"], ["createdAt", "ASC"]],
    });
    return shops.map((shop) => this._withBlueBadge(shop));
  }

  static async create(req) {
    const model = await db.Shop.create({
      type_id:        FUNCTIONS.getNumber(req.body?.type_id) || null,
      owner_id:       req.body?.owner_id ?? req.user?.id,
      name:           req.body?.name,
      name_ru:        req.body?.name_ru,
      name_eng:       req.body?.name_eng,
      description:    req.body?.description,
      description_tm: req.body?.description_tm,
      description_ru: req.body?.description_ru,
      description_en: req.body?.description_en,
      logo:           req.body?.logo,
      address:        req.body?.address,
      location:       req.body?.location,
      coordinates:    req.body?.coordinates,
      phone:          req.body?.phone,
      email:          req.body?.email,
      city_id:        FUNCTIONS.getNumber(req.body?.city_id) || null,
      region_id:      FUNCTIONS.getNumber(req.body?.region_id) || null,
      is_active:      req.body?.is_active ?? false,
      order:          FUNCTIONS.getNumber(req.body?.order) || null,
      // KYC fields
      video_url:      req.body?.video_url || null,
      passport_file:  req.body?.passport_file || null,
      patent_file:    req.body?.patent_file || null,
      bank_iban:      req.body?.bank_iban || null,
      card_number:    req.body?.card_number || null,
      createdBy:      req.user?.id,
    });

    await this._syncCategories(model.id, req.body?.categories);
    await this._syncDeliveryTypes(model.id, req.body?.delivery_type_ids);
    await this._syncBrands(model.id, req.body?.brand_ids);
    return model;
  }

  static async update(id, req) {
    if (!id) return;
    await db.Shop.update(
      {
        ...(req.body?.owner_id  !== undefined && { owner_id:  req.body.owner_id || null }),
        ...(req.body?.type_id   !== undefined && { type_id:   FUNCTIONS.getNumber(req.body.type_id)   || null }),
        ...(req.body?.city_id   !== undefined && { city_id:   FUNCTIONS.getNumber(req.body.city_id)   || null }),
        ...(req.body?.region_id !== undefined && { region_id: FUNCTIONS.getNumber(req.body.region_id) || null }),
        name:           req.body?.name,
        name_ru:        req.body?.name_ru,
        name_eng:       req.body?.name_eng,
        description:    req.body?.description,
        description_tm: req.body?.description_tm,
        description_ru: req.body?.description_ru,
        description_en: req.body?.description_en,
        logo:           req.body?.logo,
        address:        req.body?.address,
        location:       req.body?.location,
        coordinates:    req.body?.coordinates,
        phone:          req.body?.phone,
        email:          req.body?.email,
        is_active:      req.body?.is_active,
        order:          req.body?.order !== undefined ? (FUNCTIONS.getNumber(req.body.order) || null) : undefined,
        // KYC fields (only update if explicitly provided)
        ...(req.body?.video_url     !== undefined && { video_url:     req.body.video_url }),
        ...(req.body?.passport_file !== undefined && { passport_file: req.body.passport_file }),
        ...(req.body?.patent_file   !== undefined && { patent_file:   req.body.patent_file }),
        ...(req.body?.bank_iban     !== undefined && { bank_iban:     req.body.bank_iban }),
        ...(req.body?.card_number   !== undefined && { card_number:   req.body.card_number }),
      },
      { where: { id } }
    );

    if (req.body?.categories !== undefined) {
      await this._syncCategories(id, req.body.categories);
    }
    if (req.body?.delivery_type_ids !== undefined) {
      await this._syncDeliveryTypes(id, req.body.delivery_type_ids);
    }
    if (req.body?.brand_ids !== undefined) {
      await this._syncBrands(id, req.body.brand_ids);
    }
  }

  static async reassignOwner(id, ownerId) {
    if (!id) return;
    await db.Shop.update({ owner_id: ownerId }, { where: { id } });
  }

  static async delete(id, force = false) {
    if (!id) return;
    await db.Shop.destroy({ where: { id }, force });
  }

  static async _log(shop_id, action, admin_id, note) {
    if (!db.ShopVerificationLog) return;
    await db.ShopVerificationLog.create({ shop_id, action, admin_id: admin_id || null, note: note || null }).catch(() => {});
  }

  static async getVerificationLog(shopId) {
    if (!db.ShopVerificationLog || !shopId) return [];
    return db.ShopVerificationLog.findAll({
      where: { shop_id: shopId },
      include: [{ model: db.User, as: 'admin', attributes: ['id', 'name', 'surname'], required: false }],
      order: [['createdAt', 'DESC']],
    });
  }

  static async submitForReview(id, userId) {
    await db.Shop.update({ verification_status: 1 }, { where: { id } });
    await this._log(id, 'submitted', userId);
    return this.getById(id);
  }

  static async verify(id, userId, io) {
    const shop = await db.Shop.findOne({ where: { id }, attributes: ["id", "owner_id", "name", "patent_file", "bank_iban"] });
    // Auto-classify: both patent and IBAN present → Verified PRO (2), otherwise Standard (1)
    const seller_tier = (shop?.patent_file && shop?.bank_iban) ? 2 : 1;

    await db.Shop.update(
      {
        verification_status: 2,
        is_verified: seller_tier === 2,
        is_active: true,
        seller_tier,
        verified_by: userId,
        verified_at: new Date(),
        verification_note: null,
      },
      { where: { id } }
    );

    await this._log(id, 'approved', userId);

    // Ensure the owner has a ShopMember(OWNER) record for future team management
    if (shop?.owner_id && db.ShopMember) {
      await db.ShopMember.findOrCreate({
        where: { shop_id: id, user_id: shop.owner_id },
        defaults: { shop_id: id, user_id: shop.owner_id, role: 'OWNER', is_active: true },
      });
    }

    const updated = await this.getById(id);
    if (updated) {
      NotificationService.createForShopApproved(updated, io).catch(() => {});
      PushService.onShopVerified(updated).catch(() => {});
    }
    return updated;
  }

  static async reopen(id, userId) {
    await db.Shop.update(
      { verification_status: 1, is_active: false, verified_by: null, verified_at: null, verification_note: null },
      { where: { id } }
    );
    await this._log(id, 'reopened', userId);
    return this.getById(id);
  }

  static async withdraw(id, userId) {
    const note = 'Arza ulanyjy tarapyndan yzyna alyndy';
    await db.Shop.update(
      { verification_status: 3, is_verified: false, verified_by: userId, verified_at: new Date(), verification_note: note },
      { where: { id } }
    );
    await this._log(id, 'withdrawn', userId, note);
    return this.getById(id);
  }

  static async bulkUpdate(ids, { is_active, verification_status, verification_note, verifiedBy } = {}) {
    const payload = {};
    if (is_active !== undefined) payload.is_active = is_active;
    if (verification_status !== undefined) {
      payload.verification_status = verification_status;
      payload.verified_by = verifiedBy;
      payload.verified_at = new Date();
      payload.verification_note = verification_status === 3 ? (verification_note || null) : null;
      payload.is_verified = verification_status === 2;
    }
    if (!Object.keys(payload).length) return [0];
    return db.Shop.update(payload, { where: { id: { [Op.in]: ids } } });
  }

  static async reject(id, userId, note, io) {
    await db.Shop.update(
      { verification_status: 3, is_verified: false, verified_by: userId, verified_at: new Date(), verification_note: note || null },
      { where: { id } }
    );
    await this._log(id, 'rejected', userId, note);
    const shop = await this.getById(id);
    if (shop) {
      NotificationService.createForShopRejected(shop, note, io).catch(() => {});
      PushService.onShopRejected(shop, note).catch(() => {});
    }
    return shop;
  }

  // Sync shop_categories rows: destroy existing, re-insert
  static async setCategories(shopId, categoryIds) {
    return this._syncCategories(shopId, categoryIds);
  }

  static async _syncCategories(shopId, categories) {
    if (!db.ShopCategory) return;
    if (!Array.isArray(categories)) return;
    await db.ShopCategory.destroy({ where: { shop_id: shopId } });
    if (categories.length > 0) {
      await db.ShopCategory.bulkCreate(
        categories.map((category_id) => ({ shop_id: shopId, category_id })),
        { ignoreDuplicates: true }
      );
    }
  }

  // Sync shop_delivery_types rows: destroy existing, re-insert
  static async setDeliveryTypes(shopId, deliveryTypeIds) {
    return this._syncDeliveryTypes(shopId, deliveryTypeIds);
  }

  static async _syncDeliveryTypes(shopId, deliveryTypeIds) {
    if (!db.ShopDeliveryType) return;
    if (!Array.isArray(deliveryTypeIds)) return;
    await db.ShopDeliveryType.destroy({ where: { shop_id: shopId } });
    if (deliveryTypeIds.length > 0) {
      await db.ShopDeliveryType.bulkCreate(
        deliveryTypeIds.map((delivery_type_id) => ({ shop_id: shopId, delivery_type_id })),
        { ignoreDuplicates: true }
      );
    }
  }

  // Sync shop_brands rows: destroy existing, re-insert
  static async setBrands(shopId, brandIds) {
    return this._syncBrands(shopId, brandIds);
  }

  static async _syncBrands(shopId, brandIds) {
    if (!db.ShopBrand) return;
    if (!Array.isArray(brandIds)) return;
    await db.ShopBrand.destroy({ where: { shop_id: shopId } });
    if (brandIds.length > 0) {
      await db.ShopBrand.bulkCreate(
        brandIds.map((brand_id) => ({ shop_id: shopId, brand_id })),
        { ignoreDuplicates: true }
      );
    }
  }

  // ── Follows ────────────────────────────────────────────────────────────────

  static async follow(userId, shopId) {
    const shop = await db.Shop.findOne({ where: { id: shopId, is_active: true } });
    if (!shop) throw ApiError.NotFound("Dükan tapylmady");

    const [, created] = await db.ShopFollow.findOrCreate({
      where: { user_id: userId, shop_id: shopId },
      defaults: { user_id: userId, shop_id: shopId },
    });
    if (created) await db.Shop.increment("follower_count", { where: { id: shopId } });
    return { created };
  }

  static async unfollow(userId, shopId) {
    const deleted = await db.ShopFollow.destroy({ where: { user_id: userId, shop_id: shopId } });
    if (!deleted) throw ApiError.NotFound("Yzarlama tapylmady");
    await db.Shop.decrement("follower_count", { where: { id: shopId } });
    return { deleted: true };
  }

  static async getFollowedShops(userId, limit, offset) {
    return db.Shop.findAndCountAll({
      include: [{ model: db.ShopFollow, as: "follows", where: { user_id: userId }, attributes: [] }],
      where: { is_active: true },
      limit,
      offset,
      order: [["id", "DESC"]],
    });
  }
}

module.exports = ShopService;
