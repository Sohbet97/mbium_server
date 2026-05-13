const UserPositionAssignmentController = require('../controllers/user-position-assignment.controller');

const userPositionAssignmentRouter = require('express').Router();

userPositionAssignmentRouter.get('/', UserPositionAssignmentController.get.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.get('/count', UserPositionAssignmentController.getCount.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.get('/elements', UserPositionAssignmentController.getElements.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.get('/:id', UserPositionAssignmentController.getById.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.post('/', UserPositionAssignmentController.create.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.put('/:id', UserPositionAssignmentController.update.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.patch('/:id/restore', UserPositionAssignmentController.restore.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.delete('/:id', UserPositionAssignmentController.delete.bind(UserPositionAssignmentController));
userPositionAssignmentRouter.delete('/:id/force', UserPositionAssignmentController.forceDelete.bind(UserPositionAssignmentController));

module.exports = userPositionAssignmentRouter;