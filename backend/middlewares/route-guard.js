const ApiError = require("../exceptions/api-error");

/**
 * RBAC middleware factory.
 * Maps HTTP methods to permission keys and enforces them.
 *
 * @param {Object} methodPermissions - e.g. { GET: Permissions.SHOP_GET, POST: Permissions.SHOP_POST }
 */
function routeGuard(methodPermissions) {
    return (req, res, next) => {
        try {
            const role = req.user?._role;
            const requiredPermission = methodPermissions[req.method];

            if (!requiredPermission || role?.permissions?.includes(requiredPermission)) {
                return next();
            }

            throw ApiError.NotAllowed(
                `"${role?.name || ''}" - roly {${requiredPermission}} rugsadyna eýe däl`,
                requiredPermission
            );
        } catch (err) {
            next(err);
        }
    };
}

module.exports = routeGuard;
