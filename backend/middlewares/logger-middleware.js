const Logger = require("../logger/Logger")
const os = require( 'os' );
const db = require("../models");

module.exports = (req, res, next) => {
    if (!['GET', 'OPTIONS'].includes(req.method)) {
        res.on('finish', () => {
            try {
                const model = new Logger()
                model.status = res.statusCode
                model.ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress
                model.method = req.method
                model.route = (req.originalUrl || '').split('?')[0]
                model.parameters = JSON.stringify(req.params || {})
                model.body = JSON.stringify(req.body || {})
                model.query = JSON.stringify(req.query || {})
                model.userId = req?.user?.id
                db.Log.create({ ...model }).catch(() => {})
            } catch (_) {}
        })
    }
    next()
}