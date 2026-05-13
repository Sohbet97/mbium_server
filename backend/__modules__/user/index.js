const userRouter = require('./routes/user');
const userNoteRouter = require('./routes/user-note');
const positionRouter = require('./routes/position');
const roleRouter = require('./routes/role');
const userPositionAssignmentRouter = require('./routes/user-position-assignment.router');

const userModuleRouter = require('express').Router();

userModuleRouter.use('/user', userRouter)
userModuleRouter.use('/user-note', userNoteRouter)
userModuleRouter.use('/positions', positionRouter)
userModuleRouter.use('/roles', roleRouter)
userModuleRouter.use('/position-assignments', userPositionAssignmentRouter)

module.exports = userModuleRouter;