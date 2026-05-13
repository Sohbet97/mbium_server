const UserService = require("../__modules__/user/services/users");
const ApiError = require("../exceptions/api-error");

module.exports = async (req, res, next) => {
    try {
        // const authHeader = req.headers.authorization;
        // if (!authHeader) throw ApiError.UnauthorizedError();
        // const token = authHeader.split(' ')[1];
        // if (!token) throw ApiError.UnauthorizedError();
        // const userData = await UserService.validateAccessToken(token);
        // if (!userData) throw ApiError.UnauthorizedError();
        // req.user = userData;
        next();
    } catch (e) {
        next(e);
    }
};