const router = require('express').Router()
const routeGuard = require('../../middlewares/route-guard')
const Permissions = require('../../utils/permissions')
const CommentController = require('./controllers/comment.controller')

router.get(
    '/comments',
    routeGuard({ GET: Permissions.COMMENT_GET }),
    CommentController.getAll,
)

router.patch(
    '/comments/:id/status',
    routeGuard({ PATCH: Permissions.COMMENT_PUT }),
    CommentController.setStatus,
)

router.delete(
    '/comments/:id',
    routeGuard({ DELETE: Permissions.COMMENT_DELETE }),
    CommentController.delete,
)

module.exports = router
