const ShopController = require('../controllers/shop');

const shopRouter = require('express').Router();

shopRouter.get('/', ShopController.get.bind(ShopController));
shopRouter.get('/count', ShopController.getCount.bind(ShopController));
shopRouter.get('/:id', ShopController.getById.bind(ShopController));
shopRouter.post('/', ShopController.create.bind(ShopController));
shopRouter.put('/:id', ShopController.update.bind(ShopController));
shopRouter.patch('/:id/submit', ShopController.submitForReview.bind(ShopController));
shopRouter.patch('/:id/verify', ShopController.verify.bind(ShopController));
shopRouter.patch('/:id/reject', ShopController.reject.bind(ShopController));
shopRouter.patch('/:id/restore', ShopController.restore.bind(ShopController));
shopRouter.delete('/:id', ShopController.delete.bind(ShopController));
shopRouter.delete('/:id/force', ShopController.forceDelete.bind(ShopController));

module.exports = shopRouter;