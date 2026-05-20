const ApiError = require("../exceptions/api-error");

module.exports = (PERMISSION_KEY) => {
    return (req, res, next) => {
        try {
            const role = req.user?._role;
            if (role?.permissions?.includes(PERMISSION_KEY)) {
                return next();
            }
            throw ApiError.NotAllowed(
                `"${role?.name || ''}" - roly {${PERMISSION_KEY}} rugsadyna eýe däl`,
                PERMISSION_KEY
            );
        } catch (e) {
            next(e);
        }
    };
};
