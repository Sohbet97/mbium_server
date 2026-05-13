const SystemDumpController = require('../../controllers/system-dump-controller')

const systemDumpsRouter = require('express').Router()

systemDumpsRouter.get('/',  SystemDumpController.get.bind(SystemDumpController))

systemDumpsRouter.get('/cout',  SystemDumpController.getCount.bind(SystemDumpController))

systemDumpsRouter.get('/:id',  SystemDumpController.getById)

systemDumpsRouter.post('/',  SystemDumpController.create.bind(SystemDumpController))

systemDumpsRouter.delete('/:id',  SystemDumpController.delete.bind(SystemDumpController))

// alernateVisitRouter.delete('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.ANALYSE_DELETE), AnalyseController.delete)

module.exports = systemDumpsRouter