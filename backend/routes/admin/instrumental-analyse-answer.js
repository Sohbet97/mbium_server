const InstrumentalAnalyseAnswerController = require('../../controllers/instrumental-analyse-answer-controller');
const rbacMiddleware = require('../../middlewares/rbac-middleware');
const Permissions = require('../../utils/permissions');

const instrumentalAnalyseAnswerRouter = require('express').Router()

instrumentalAnalyseAnswerRouter.get('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_GET), InstrumentalAnalyseAnswerController.get.bind(InstrumentalAnalyseAnswerController))

instrumentalAnalyseAnswerRouter.get('/filter', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_GET), InstrumentalAnalyseAnswerController.filter)

instrumentalAnalyseAnswerRouter.get('/raw', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_GET), InstrumentalAnalyseAnswerController.getRaw.bind(InstrumentalAnalyseAnswerController))

instrumentalAnalyseAnswerRouter.get('/count', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_GET), InstrumentalAnalyseAnswerController.getCount.bind(InstrumentalAnalyseAnswerController))

instrumentalAnalyseAnswerRouter.get('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_GET), InstrumentalAnalyseAnswerController.getById);

instrumentalAnalyseAnswerRouter.post('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_POST), InstrumentalAnalyseAnswerController.create.bind(InstrumentalAnalyseAnswerController))

instrumentalAnalyseAnswerRouter.put('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_PUT), InstrumentalAnalyseAnswerController.update.bind(InstrumentalAnalyseAnswerController))

instrumentalAnalyseAnswerRouter.delete('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.INSTRUMENTAL_ANALYSE_ANSWER_DELETE), InstrumentalAnalyseAnswerController.delete)

module.exports = instrumentalAnalyseAnswerRouter