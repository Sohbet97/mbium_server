const DepartmentController = require('../../controllers/department-controller')
const rbacMiddleware = require('../../middlewares/rbac-middleware')
const Permissions = require('../../utils/permissions')

const departmentRouter = require('express').Router()

departmentRouter.get('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_GET), DepartmentController.get.bind(DepartmentController))

departmentRouter.get('/count', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_GET), DepartmentController.getCount.bind(DepartmentController))

departmentRouter.get('/filter', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_GET), DepartmentController.filter)

departmentRouter.get('/analyses', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_GET), DepartmentController.getAnalyses.bind(DepartmentController))

departmentRouter.get('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_GET), DepartmentController.getById)

departmentRouter.post('/', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_POST), DepartmentController.create.bind(DepartmentController))

departmentRouter.put('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_PUT), DepartmentController.update.bind(DepartmentController))

departmentRouter.delete('/:id', (req, res, next)=>rbacMiddleware(req, next, Permissions.DEPARTMENT_DELETE), DepartmentController.delete)

module.exports = departmentRouter