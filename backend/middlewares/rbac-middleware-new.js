const ApiError = require("../exceptions/api-error")

module.exports = async (PERMISSION_KEY) => {
    return (req, res, next) => {
        try {
            // const user = req.user;
            // const role = user?._role;

            // if (role?.permissions?.includes(PERMISSION_KEY)) {
                return next();
            // }

            // throw ApiError.NotAllowed(
            //     `"${role?.name || ''}" - roly {${PERMISSION_KEY}} rugsadyna eýe däl`,
            //     PERMISSION_KEY
            // );
        } catch (e) {
            next(e);
        }
    };
}