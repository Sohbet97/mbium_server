const ApiError = require("../exceptions/api-error")

module.exports = async (req, next, PERMISSION_KEY) => {
    try {
        const user = req.user;
        const role = user?._role;

        if (role?.permissions?.includes(PERMISSION_KEY)) {
            return next();
        }

        const context = user?._assignment
            ? `[${user._assignment.assignment_type} — ${user._assignment.position_name}]`
            : '[no assignment]';

        throw ApiError.NotAllowed(
            `"${role?.name || ''}" - roly {${PERMISSION_KEY}} rugsadyna eýe däl`,
            PERMISSION_KEY
        );
    } catch (e) {
        next(e);
    }
};