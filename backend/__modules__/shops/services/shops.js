const { Op } = require("sequelize");
const db = require("../../../models");
const { FUNCTIONS } = require("../../../utils/functions");
const { CONSTANTS } = require("../../../config/constants");
const SHOP_CONSTANTS = require("../utils/constants");

class ShopService {
  static async get(filter = {}, limit = undefined, order = SHOP_CONSTANTS.DEFAULT_SORT, offset = 0, paranoid = true) {
    const data = await db.Shop.findAll({
      where: filter,
      offset,
      order,
      limit,
      paranoid,
      include: [
        {
          model: db.ShopType,
          as: "type",
          attributes: ["name"],
        }
      ],
    });
    return data;
  }

  static async getForFilter() {
    return this.get(
      {
        is_active: { [Op.eq]: true },
      },
      CONSTANTS.MAX_ROWS
    );
  }

  static async getCount(filter = {}, paranoid = true) {
    const count = await db.Shop.count({
      where: filter,
      paranoid
    });
    return count;
  }

  static async getById(id, paranoid = true) {
    if (!id) return;
    const model = await db.Shop.findOne({
      where: { id },
      paranoid,
      include: [
        { model: db.ShopType, as: "type", attributes: ["id", "name"] },
        { model: db.User, as: "owner", attributes: ["id", "name", "surname", "phone_number", "email", "status"] },
      ],
    });
    return model;
  }

  static async create(req) {
    const model = await db.Shop.create({
      type_id: FUNCTIONS.getNumber(req.body?.type_id) || null,
      name: req.body?.name,
      name_ru: req.body?.name_ru,
      name_eng: req.body?.name_eng,
      is_active: req.body?.is_active,
      order: FUNCTIONS.getNumber(req.body?.order) || null,
      createdBy: req.user?.id
    });
    return model;
  }

  static async update(id, req) {
    if (!id) return;
    const model = await db.Shop.update(
      {
        type_id: FUNCTIONS.getNumber(req.body?.type_id) || null,
        name: req.body?.name,
        name_ru: req.body?.name_ru,
        name_eng: req.body?.name_eng,
        is_active: req.body?.is_active,
        order: FUNCTIONS.getNumber(req.body?.order) || null
      },
      { where: { id } }
    );
    return model;
  }

  static async delete(id, force = false) {
    if (!id) return;
    await db.Shop.destroy({ where: { id }, force });
  }

  static async submitForReview(id) {
    await db.Shop.update({ verification_status: 1 }, { where: { id } });
    return this.getById(id);
  }

  static async verify(id, userId) {
    await db.Shop.update(
      { verification_status: 2, is_verified: true, verified_by: userId, verified_at: new Date(), verification_note: null },
      { where: { id } }
    );
    return this.getById(id);
  }

  static async reject(id, userId, note) {
    await db.Shop.update(
      { verification_status: 3, is_verified: false, verified_by: userId, verified_at: new Date(), verification_note: note || null },
      { where: { id } }
    );
    return this.getById(id);
  }
}

module.exports = ShopService;
