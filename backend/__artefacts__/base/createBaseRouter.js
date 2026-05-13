const { Router } = require("express");

/**
 * createBaseRouter — wires the standard 8 REST routes for any controller
 * that extends BaseController.
 *
 * @param {typeof import("./BaseController")} Controller
 * @param {Router} [router] — pass an existing router to extend it
 * @returns {Router}
 *
 * @example
 * const shopRouter = createBaseRouter(ShopController);
 * module.exports = shopRouter;
 *
 * // With extra routes:
 * const router = createBaseRouter(ShopController);
 * router.get('/export', ShopController.export.bind(ShopController));
 * module.exports = router;
 */
function createBaseRouter(Controller, router = Router()) {
    const bind = (method) => Controller[method].bind(Controller);

    router.get("/", bind("get"));
    router.get("/count", bind("getCount"));
    router.get("/:id", bind("getById"));
    router.post("/", bind("create"));
    router.put("/:id", bind("update"));
    router.patch("/:id/restore", bind("restore"));
    router.delete("/:id", bind("delete"));
    router.delete("/:id/force", bind("forceDelete"));

    return router;
}

module.exports = { createBaseRouter };
