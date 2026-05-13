const DistrictController = require('../../controllers/district-controller');

const districtRouter = require('express').Router();

districtRouter.get('/', DistrictController.get.bind(DistrictController));

districtRouter.get('/count', DistrictController.getCount.bind(DistrictController));

districtRouter.get('/:id', DistrictController.getById);

districtRouter.post('/', DistrictController.create.bind(DistrictController));

districtRouter.put('/:id', DistrictController.update.bind(DistrictController));

districtRouter.delete('/:id', DistrictController.delete);

module.exports = districtRouter;