const db = require("../models");
const ConfigService = require("../services/config");
const { FUNCTIONS } = require("../utils/functions");
const REDIS_KEYS = require("../utils/redis/keys");
const { getOrSet, trySet } = require("../utils/redis/redis-client");

class ConfigController {
  //#region routes
  static async get(req, res, next) {
    try {
      let model = await getOrSet(req, REDIS_KEYS.CONFIG, ConfigService.get);
      if (!model) model = await db.Config.create({});
      return res.status(200).json({ model });
    } catch (e) {
      next(e);
    }
  }

  static async update(req, res, next) {
    try {
      // Find or create config model
      let model = await db.Config.findOne();
      if (!model) {
        model = await db.Config.create({});
      }

      // Update pricing and foreign exchange
      model.is_otp_enabled = Boolean(req.body?.is_otp_enabled) || false;

      // Save and respond
      await model.save();
      const saved = await trySet(req, REDIS_KEYS.CONFIG, ConfigService.get);
      res.status(200).json({ model });
      next();
    } catch (e) {
      next(e);
    }
  }
  //#endregion
}
module.exports = ConfigController;
