const UserNoteController = require('../controllers/user-note-controller')

const userNoteRouter = require('express').Router()

userNoteRouter.get('/', UserNoteController.get.bind(UserNoteController))

userNoteRouter.get('/own', UserNoteController.getOwn.bind(UserNoteController))

userNoteRouter.get('/:id', UserNoteController.getById)

userNoteRouter.post('/', UserNoteController.create.bind(UserNoteController))

userNoteRouter.put('/', UserNoteController.update.bind(UserNoteController))

userNoteRouter.delete('/:id', UserNoteController.delete)

module.exports = userNoteRouter