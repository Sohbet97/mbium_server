const AdService = require("../services/ads");
const { FUNCTIONS } = require("../../../utils/functions");

const wrap = (fn) => async (req, res, next) => {
    try { await fn(req, res); } catch (e) { next(e); }
};
const page = (req) => {
    const { limit, skip } = FUNCTIONS.getQueryParams(req);
    return { limit, skip };
};

// ——— Admin ———
const admin = {
    getSettings: wrap(async (req, res) => res.json({ model: await AdService.settings() })),
    updateSettings: wrap(async (req, res) => res.json({ model: await AdService.updateSettings(req.body || {}) })),

    listTaskTypes: wrap(async (req, res) => res.json({ data: await AdService.listTaskTypes() })),
    createTaskType: wrap(async (req, res) => res.status(201).json({ model: await AdService.createTaskType(req.body || {}) })),
    updateTaskType: wrap(async (req, res) => res.json({ model: await AdService.updateTaskType(req.params.id, req.body || {}) })),
    deleteTaskType: wrap(async (req, res) => res.json(await AdService.deleteTaskType(req.params.id))),

    listCampaigns: wrap(async (req, res) => {
        const { limit, skip } = page(req);
        res.json(await AdService.listCampaigns({ status: req.query.status, shop_id: req.query.shop_id }, limit, skip));
    }),
    getCampaign: wrap(async (req, res) => res.json({ model: await AdService.getCampaign(req.params.id) })),
    reviewCampaign: wrap(async (req, res) => res.json({ model: await AdService.reviewCampaign(req.params.id, req.body || {}) })),

    listCompletions: wrap(async (req, res) => {
        const { limit, skip } = page(req);
        res.json(await AdService.listCompletions({ status: req.query.status, campaign_id: req.query.campaign_id }, limit, skip));
    }),
    moderateCompletion: wrap(async (req, res) => res.json({ model: await AdService.moderateCompletion(req.params.id, req.body || {}) })),
};

// ——— Seller (always scoped to req.shop) ———
const seller = {
    taskTypes: wrap(async (req, res) => {
        const [types, access, settings] = await Promise.all([
            AdService.listTaskTypes({ activeOnly: true }),
            AdService.planAccess(req.shop),
            AdService.settings(),
        ]);
        res.json({
            data: types,
            allowed: access.allowed,
            plan: access.plan ? { id: access.plan.id, name: access.plan.name } : null,
            user_percent: access.user_percent,
            min_budget: settings.min_budget,
            ball_rate: settings.ball_rate,
        });
    }),
    createCampaign: wrap(async (req, res) => res.status(201).json({ model: await AdService.createCampaign(req.shop, req.body || {}) })),
    listCampaigns: wrap(async (req, res) => {
        const { limit, skip } = page(req);
        res.json(await AdService.listCampaigns({ shop_id: req.shop.id, status: req.query.status }, limit, skip));
    }),
    getCampaign: wrap(async (req, res) => res.json({ model: await AdService.getCampaign(req.params.id, { shopId: req.shop.id }) })),
    listCompletions: wrap(async (req, res) => {
        await AdService.getCampaign(req.params.id, { shopId: req.shop.id }); // 404 for other shops' campaigns
        const { limit, skip } = page(req);
        const result = await AdService.listCompletions({ campaign_id: req.params.id }, limit, skip);
        // Sellers see who did a task, not the buyer's phone number
        result.data = result.data.map((x) => ({ ...x, user: x.user && { id: x.user.id, name: x.user.name, surname: x.user.surname } }));
        res.json(result);
    }),
};

// ——— Buyer ———
const buyer = {
    listCampaigns: wrap(async (req, res) => {
        const { limit, skip } = page(req);
        res.json(await AdService.listActiveForBuyer(req.user?.id, limit, skip));
    }),
    getCampaign: wrap(async (req, res) => res.json({ model: await AdService.getForBuyer(req.user?.id, req.params.id) })),
    history: wrap(async (req, res) => {
        const { limit, skip } = page(req);
        res.json(await AdService.buyerHistory(req.user.id, limit, skip));
    }),
};

module.exports = { admin, seller, buyer };
