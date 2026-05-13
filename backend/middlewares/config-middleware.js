const ConfigService = require("../services/config");
const REDIS_KEYS = require("../utils/redis/keys");
const { getOrSet } = require("../utils/redis/redis-client");

function configMiddleware() {
    return async (req, res, next) => {
        let config = await getOrSet(req, REDIS_KEYS.CONFIG, ConfigService.get);
        if (config) req.config = config;
        next();
    };
}

module.exports = configMiddleware;