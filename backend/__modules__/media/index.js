const authorizationMiddleware = require('../../middlewares/authorization-middleware')
const routeGuard = require('../../middlewares/route-guard')
const Permissions = require('../../utils/permissions')
const mediaRouter = require('./routes/media')

const mediaModuleRouter = require('express').Router()

mediaModuleRouter.use(
    authorizationMiddleware,
    routeGuard({
        GET:    Permissions.MEDIA_GET,
        POST:   Permissions.MEDIA_POST,
        PUT:    Permissions.MEDIA_PUT,
        PATCH:  Permissions.MEDIA_PUT,
        DELETE: Permissions.MEDIA_DELETE,
    })
)

mediaModuleRouter.use('/media', mediaRouter)

module.exports = mediaModuleRouter
