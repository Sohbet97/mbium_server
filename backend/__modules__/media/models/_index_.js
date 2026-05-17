const loadModules = require('../../../__artefacts__/models.autoloader')

module.exports = (sequelize, db) => loadModules(__dirname, '.model.js', [sequelize, db])
