const router = require("express").Router();
const routeGuard = require("../../middlewares/route-guard");
const Permissions = require("../../utils/permissions");
const coinRouter = require("./routes/coin.routes");

router.use(
    routeGuard({
        GET:    Permissions.COIN_GET,
        POST:   Permissions.COIN_POST,
        PUT:    Permissions.COIN_PUT,
        DELETE: Permissions.COIN_DELETE,
        PATCH:  Permissions.COIN_PUT,
    })
);

router.use("/coins", coinRouter);

module.exports = router;
