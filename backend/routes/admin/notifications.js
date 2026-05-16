const router = require('express').Router();
const NotificationController = require('../../controllers/notification-controller');

router.get('/', NotificationController.get);
router.get('/count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

module.exports = router;
