const Logger = require("../logger/Logger")
const os = require( 'os' );
const db = require("../models");

module.exports = (req, res, next)=>{
    if(!['GET', 'OPTONS'].includes(req.method)){
        const model = new Logger()
        model.status = Number(res.statusCode) || undefined
        model.ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress
        model.method = req.method
        model.route = req.originalUrl
        model.parameters = JSON.stringify(req.params || {})
        model.body = JSON.stringify(req.body || {})
        model.query = JSON.stringify(req.query || {})
        model.userId = req?.user?.id
        db.Log.create({
            ...model
        }).catch((e)=>{})
    }
    return res.end()
}