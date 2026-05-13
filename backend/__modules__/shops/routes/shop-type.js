const ShopTypeController = require('../controllers/shop-type');

const shopTypeRouter = require('express').Router();

shopTypeRouter.get('/', ShopTypeController.get.bind(ShopTypeController));
shopTypeRouter.get('/count', ShopTypeController.getCount.bind(ShopTypeController));
shopTypeRouter.get('/:id', ShopTypeController.getById.bind(ShopTypeController));
shopTypeRouter.post('/', ShopTypeController.create.bind(ShopTypeController));
shopTypeRouter.put('/:id', ShopTypeController.update.bind(ShopTypeController));
shopTypeRouter.patch('/:id/restore', ShopTypeController.restore.bind(ShopTypeController));
shopTypeRouter.delete('/:id', ShopTypeController.delete.bind(ShopTypeController));
shopTypeRouter.delete('/:id/force', ShopTypeController.forceDelete.bind(ShopTypeController));

module.exports = shopTypeRouter;