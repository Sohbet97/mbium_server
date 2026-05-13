const db = require("../models");

class ConfigService {
    static async get() {
        let model = await db.Config.findOne();
        if(!model) model = await db.Config.create();
        return model || null;
    }
}

module.exports = ConfigService;