const ConfigController = require('../../controllers/config-controller')

const configRouter = require('express').Router()

configRouter.get('/', ConfigController.get.bind(ConfigController))

configRouter.put('/', ConfigController.update.bind(ConfigController))

module.exports = configRouter
