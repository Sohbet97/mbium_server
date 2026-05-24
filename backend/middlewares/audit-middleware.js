const AuditService = require("../__modules__/audit/services/AuditService");

const METHOD_ACTION = {
    POST:   "CREATE",
    PUT:    "UPDATE",
    PATCH:  "UPDATE",
    DELETE: "DELETE",
};

// Priority-ordered rules — sub-action patterns must come before generic /:id patterns.
// Each rule: { p: RegExp, et: entityType, gi: getEntityId(match, req), ga: getAction(match, req) }
const RULES = [
    // Users
    { p: /\/admin\/user\/([a-f0-9-]+)\/unlock$/i,
      et: "User", gi: (m) => m[1], ga: () => "UNLOCK" },
    { p: /\/admin\/user(?:\/([a-f0-9-]+))?/i,
      et: "User", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Roles / positions
    { p: /\/admin\/roles(?:\/(\d+))?/i,
      et: "Role", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/positions(?:\/(\d+))?/i,
      et: "Position", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Shops — sub-actions first
    { p: /\/admin\/shops\/(\d+)\/(verify|reject|restore|submit)/i,
      et: "Shop", gi: (m) => m[1], ga: (m) => m[2].toUpperCase() },
    { p: /\/admin\/shops\/(\d+)\/force/i,
      et: "Shop", gi: (m) => m[1], ga: () => "FORCE_DELETE" },
    { p: /\/admin\/shops(?:\/(\d+))?/i,
      et: "Shop", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Shop applications
    { p: /\/admin\/shop-applications\/(\d+)\/(verify|reject|reopen)/i,
      et: "ShopApplication", gi: (m) => m[1], ga: (m) => m[2].toUpperCase() },

    // Shop type requests
    { p: /\/admin\/shop-type-requests\/(\d+)\/(approve|reject)/i,
      et: "ShopTypeRequest", gi: (m) => m[1], ga: (m) => m[2].toUpperCase() },
    { p: /\/admin\/shop-types(?:\/(\d+))?/i,
      et: "ShopType", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Products — variants before generic
    { p: /\/admin\/products\/(\d+)\/variants(?:\/(\d+))?/i,
      et: "ProductVariant", gi: (m) => m[2] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/products\/(\d+)\/restore/i,
      et: "Product", gi: (m) => m[1], ga: () => "RESTORE" },
    { p: /\/admin\/products\/(\d+)\/force/i,
      et: "Product", gi: (m) => m[1], ga: () => "FORCE_DELETE" },
    { p: /\/admin\/products(?:\/(\d+))?/i,
      et: "Product", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Categories
    { p: /\/admin\/categories\/(\d+)\/restore/i,
      et: "Category", gi: (m) => m[1], ga: () => "RESTORE" },
    { p: /\/admin\/categories\/(\d+)\/force/i,
      et: "Category", gi: (m) => m[1], ga: () => "FORCE_DELETE" },
    { p: /\/admin\/categories(?:\/(\d+))?/i,
      et: "Category", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Collections
    { p: /\/admin\/collections\/(\d+)\/products(?:\/(\d+))?/i,
      et: "CollectionProduct", gi: (m) => m[2] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/collections(?:\/(\d+))?/i,
      et: "Collection", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Orders
    { p: /\/admin\/orders\/(\d+)\/status/i,
      et: "Order", gi: (m) => m[1], ga: () => "UPDATE_STATUS" },
    { p: /\/admin\/orders(?:\/(\d+))?/i,
      et: "Order", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Discounts
    { p: /\/admin\/discounts(?:\/(\d+))?/i,
      et: "Discount", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Banners — types before generic
    { p: /\/admin\/banners\/types(?:\/(\d+))?/i,
      et: "BannerType", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/banners\/(\d+)\/restore/i,
      et: "Banner", gi: (m) => m[1], ga: () => "RESTORE" },
    { p: /\/admin\/banners(?:\/(\d+))?/i,
      et: "Banner", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Delivers
    { p: /\/admin\/delivers(?:\/(\d+))?/i,
      et: "Deliver", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Payouts
    { p: /\/admin\/payouts\/requests\/(\d+)\/(status|restore)/i,
      et: "PayoutRequest", gi: (m) => m[1], ga: (m) => m[2].toUpperCase() },
    { p: /\/admin\/payouts\/requests(?:\/(\d+))?/i,
      et: "PayoutRequest", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/payouts\/balances(?:\/(\d+))?/i,
      et: "SellerBalance", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Plans / subscriptions
    { p: /\/admin\/plans(?:\/(\d+))?/i,
      et: "Plan", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/shop-subscriptions(?:\/(\d+))?/i,
      et: "ShopSubscription", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Reviews
    { p: /\/admin\/reviews(?:\/(\d+))?/i,
      et: "Review", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Disputes
    { p: /\/admin\/disputes\/(\d+)\/status/i,
      et: "Dispute", gi: (m) => m[1], ga: () => "UPDATE_STATUS" },
    { p: /\/admin\/disputes(?:\/(\d+))?/i,
      et: "Dispute", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // AI recommendations
    { p: /\/admin\/ai-recommendations(?:\/(\d+))?/i,
      et: "AiRecommendation", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Push notifications
    { p: /\/admin\/push-notifications/i,
      et: "PushNotification", gi: () => null, ga: () => "SEND" },

    // Media — upload before generic
    { p: /\/admin\/media\/upload/i,
      et: "Media", gi: () => null, ga: () => "UPLOAD" },
    { p: /\/admin\/media(?:\/(\d+))?/i,
      et: "Media", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Locations
    { p: /\/admin\/country(?:\/(\d+))?/i,
      et: "Country", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/region(?:\/(\d+))?/i,
      et: "Region", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/districts(?:\/(\d+))?/i,
      et: "District", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/village(?:\/(\d+))?/i,
      et: "Village", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
    { p: /\/admin\/city(?:\/(\d+))?/i,
      et: "City", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Configurations
    { p: /\/admin\/configurations/i,
      et: "Config", gi: () => null, ga: (m, r) => METHOD_ACTION[r.method] },

    // Shop members
    { p: /\/admin\/shop-members(?:\/(\d+))?/i,
      et: "ShopMember", gi: (m) => m[1] || null, ga: (m, r) => METHOD_ACTION[r.method] },
];

const ACTION_VERBS = {
    CREATE:        "created",
    UPDATE:        "updated",
    DELETE:        "deleted",
    FORCE_DELETE:  "force-deleted",
    RESTORE:       "restored",
    VERIFY:        "verified",
    REJECT:        "rejected",
    APPROVE:       "approved",
    SUBMIT:        "submitted for review",
    REOPEN:        "re-opened",
    UNLOCK:        "unlocked",
    SEND:          "sent",
    UPLOAD:        "uploaded",
    UPDATE_STATUS: "changed status of",
    STATUS:        "changed status of",
};

function buildDescription(entity_type, entity_id, action, actorName) {
    const who    = actorName || "Admin";
    const target = entity_id ? `${entity_type} #${entity_id}` : entity_type;
    const verb   = ACTION_VERBS[action] || action.toLowerCase();
    return `${who} ${verb} ${target}`;
}

module.exports = function auditMiddleware(req, res, next) {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

    const urlPath = (req.originalUrl || "").split("?")[0];

    res.on("finish", () => {
        try {
            if (res.statusCode < 200 || res.statusCode >= 300) return;

            let entity_type = null, entity_id = null, action = null;
            for (const rule of RULES) {
                const m = urlPath.match(rule.p);
                if (m) {
                    entity_type = rule.et;
                    entity_id   = rule.gi(m, req);
                    action      = rule.ga(m, req);
                    break;
                }
            }

            if (!entity_type || !action) return;

            const actor     = req.user;
            const actor_id  = actor?.id || null;
            const actorName = actor
                ? `${actor.name || ""} ${actor.surname || ""}`.trim() || null
                : null;
            const ip_address  = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
            const description = buildDescription(entity_type, entity_id, action, actorName);

            AuditService.log({ entity_type, entity_id, action, actor_id, ip_address, description });
        } catch (_) {}
    });

    next();
};
