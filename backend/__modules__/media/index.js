const authorizationMiddleware = require('../../middlewares/authorization-middleware')
const routeGuard = require('../../middlewares/route-guard')
const Permissions = require('../../utils/permissions')
const mediaRouter = require('./routes/media')

const mediaModuleRouter = require('express').Router()

// Guard only this module's paths: a path-less use() would apply it to every admin route mounted after it
mediaModuleRouter.use(
    '/media',
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
