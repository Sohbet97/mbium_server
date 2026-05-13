const ApiError = require("../exceptions/api-error");

/**
 * RBAC middleware factory.
 * Maps HTTP methods to permission keys and enforces them.
 *
 * @param {Object} methodPermissions - e.g. { GET: "PERM_GET", POST: "PERM_POST" }
 */
function routeGuard(methodPermissions) {
  return (req, res, next) => {
    try {
      const user = req.user;
      const role = user?._role;
      const requiredPermission = methodPermissions[req.method];
      
      if (!requiredPermission || role?.permissions?.includes(requiredPermission)) {
        return next();
      }

      const context = user?._assignment
        ? `[${user._assignment.assignment_type} — ${user._assignment.position_name}]`
        : '[no assignment]';

      throw ApiError.NotAllowed(
        `"${role?.name || ''}" ${context} - roly {${requiredPermission}} rugsadyna eýe däl`,
        requiredPermission
      );
    } catch (err) {
      next(err);
    }
  };
}

module.exports = routeGuard;