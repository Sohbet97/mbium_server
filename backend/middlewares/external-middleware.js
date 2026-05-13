const { CONSTANTS } = require("../config/constants")
const ApiError = require("../exceptions/api-error")

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader) throw ApiError.UnauthorizedError()
        const token = authHeader.split(' ')[1]
        if (!token || token != process.env.EXTERNAL_SECRET) throw ApiError.UnauthorizedError()
        next()
    } catch (e) {
        next(e)
    }
}