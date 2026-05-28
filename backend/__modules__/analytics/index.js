const routeGuard = require('../../middlewares/route-guard');
const Permissions = require('../../utils/permissions');
const analyticsRouter = require('./routes/analytics');

const moduleRouter = require('express').Router();

moduleRouter.use(
    '/analytics',
    routeGuard({ GET: Permissions.ANALYTICS_GET }),
    analyticsRouter
);

module.exports = moduleRouter;
