const VillageController = require('../../controllers/village-controller');
const rbacMiddleware = require('../../middlewares/rbac-middleware');
const Permissions = require('../../utils/permissions');

const villageRouter = require('express').Router();

villageRouter.get('/', (req, res, next) => rbacMiddleware(req, next, Permissions.VILLAGE_GET), VillageController.get.bind(VillageController));

villageRouter.get('/count', (req, res, next) => rbacMiddleware(req, next, Permissions.VILLAGE_GET), VillageController.getCount.bind(VillageController));

villageRouter.get('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.VILLAGE_GET), VillageController.getById);

villageRouter.post('/', (req, res, next) => rbacMiddleware(req, next, Permissions.VILLAGE_POST), VillageController.create.bind(VillageController));

villageRouter.put('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.VILLAGE_PUT), VillageController.update.bind(VillageController));

villageRouter.delete('/:id', (req, res, next) => rbacMiddleware(req, next, Permissions.VILLAGE_DELETE), VillageController.delete);

module.exports = villageRouter;