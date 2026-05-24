const rbacMiddleware = require("../../../middlewares/rbac-middleware");
const Permissions    = require("../../../utils/permissions");
const AuditService   = require("../services/AuditService");
const { FUNCTIONS }  = require("../../../utils/functions");

const router = require("express").Router();

router.get(
    "/",
    (req, res, next) => rbacMiddleware(req, next, Permissions.AUDIT_GET),
    async (req, res, next) => {
        try {
            const { limit, skip } = FUNCTIONS.getQueryParams(req);
            const { entity_type, actor_id, action, date_from, date_to, search } = req.query;
            const result = await AuditService.getAll(
                { entity_type, actor_id, action, date_from, date_to, search },
                limit,
                skip
            );
            res.json(result);
        } catch (e) { next(e); }
    }
);

module.exports = router;
