//#region definitions
const adminRouter = require("express").Router()
const countryRouter = require('./country')
const regionRouter = require("./region")
const villageRouter = require("./village")

const cityRouter = require("./city")
const logRouter = require("./log")
const systemDumpsRouter = require("./system_dumps")
const districtRouter = require("./district")

const configRouter = require("./config")
const userModuleRouter = require("../../__modules__/user")
const shopModuleRouter = require("../../__modules__/shops")
const catalogModuleRouter = require("../../__modules__/catalog")
const ordersModuleRouter = require("../../__modules__/orders")
const reviewsModuleRouter = require("../../__modules__/reviews")
const discountsModuleRouter = require("../../__modules__/discounts")
const authorizationMiddleware = require("../../middlewares/authorization-middleware")
//#endregion

//#region Routes
adminRouter.use('/configurations', configRouter)
adminRouter.use(authorizationMiddleware)

adminRouter.use(userModuleRouter)
adminRouter.use(shopModuleRouter)
adminRouter.use(catalogModuleRouter)
adminRouter.use(ordersModuleRouter)
adminRouter.use(reviewsModuleRouter)
adminRouter.use(discountsModuleRouter)
adminRouter.use('/system-dumps', systemDumpsRouter)
adminRouter.use('/country', countryRouter)
adminRouter.use('/region', regionRouter)
adminRouter.use('/districts', districtRouter)
adminRouter.use('/village', villageRouter)
adminRouter.use('/city', cityRouter)

adminRouter.use('/log', logRouter)
//#endregion

module.exports = adminRouter;