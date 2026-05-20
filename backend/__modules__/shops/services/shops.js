const { Op } = require("sequelize");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const { CONSTANTS } = require("../../../config/constants");
const SHOP_CONSTANTS = require("../utils/constants");
const NotificationService = require("../../../services/notifications");

class ShopService {
  static async get(filter = {}, limit = undefined, order = SHOP_CONSTANTS.DEFAULT_SORT, offset = 0, paranoid = true) {
    return db.Shop.findAll({
      where: filter,
      offset,
      order,
      limit,
      paranoid,
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name", "commission_rate"] },
      ],
    });
  }

  static async getForFilter() {
    return this.get({ is_active: { [Op.eq]: true } }, CONSTANTS.MAX_ROWS);
  }

  static async getCount(filter = {}, paranoid = true) {
    return db.Shop.count({ where: filter, paranoid });
  }

  static async getById(id, paranoid = true) {
    if (!id) return;
    return db.Shop.findOne({
      where: { id },
      paranoid,
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name", "commission_rate"] },
        { model: db.User, as: "owner", attributes: ["id", "name", "surname", "phone_number", "email", "status"] },
        ...(db.Category ? [{ model: db.Category, as: "categories", through: { attributes: [] } }] : []),
      ],
    });
  }

  static async getByOwner(userId) {
    if (!userId) return null;
    return db.Shop.findOne({
      where: { owner_id: userId },
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name", "commission_rate"] },
        ...(db.Category ? [{ model: db.Category, as: "categories", through: { attributes: [] } }] : []),
      ],
    });
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
    return model;
  }

  static async update(id, req) {
    if (!id) return;
    await db.Shop.update(
      {
        type_id:        FUNCTIONS.getNumber(req.body?.type_id) || null,
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
  }

  static async delete(id, force = false) {
    if (!id) return;
    await db.Shop.destroy({ where: { id }, force });
  }

  static async submitForReview(id) {
    await db.Shop.update({ verification_status: 1 }, { where: { id } });
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
    }
    return updated;
  }

  static async reject(id, userId, note, io) {
    await db.Shop.update(
      { verification_status: 3, is_verified: false, verified_by: userId, verified_at: new Date(), verification_note: note || null },
      { where: { id } }
    );
    const shop = await this.getById(id);
    if (shop) {
      NotificationService.createForShopRejected(shop, note, io).catch(() => {});
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
}

module.exports = ShopService;
