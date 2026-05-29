const router = require('express').Router();
const AnalyticsController = require('../controllers/analytics');

router.get('/overview', AnalyticsController.getOverview.bind(AnalyticsController));
router.get('/shops',    AnalyticsController.getShops.bind(AnalyticsController));
router.get('/users',    AnalyticsController.getUsers.bind(AnalyticsController));
router.get('/orders',   AnalyticsController.getOrders.bind(AnalyticsController));

module.exports = router;
