const security = [{ BearerAuth: [] }];

const sendBody = {
    required: true,
    content: {
        "application/json": {
            schema: {
                type: "object",
                required: ["title", "body"],
                properties: {
                    title:    { type: "string", maxLength: 200, example: "Big sale today!" },
                    body:     { type: "string", maxLength: 1000, example: "Get up to 50% off — today only." },
                    imageUrl: { type: "string", format: "uri", nullable: true, example: "https://cdn.example.com/sale.jpg" },
                    data:     { type: "object", additionalProperties: { type: "string" }, nullable: true, description: "Extra key-value payload (all values must be strings)" },
                },
            },
        },
    },
};

const campaignResponse = {
    description: "Campaign created and dispatched",
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties: { campaign: { $ref: "#/components/schemas/PushNotificationCampaign" } },
            },
        },
    },
};

const listResponse = (extraProps = {}) => ({
    description: "Campaign list",
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties: {
                    data:  { type: "array", items: { $ref: "#/components/schemas/PushNotificationCampaign" } },
                    total: { type: "integer", example: 42 },
                    ...extraProps,
                },
            },
        },
    },
});

module.exports = {
    // ── Admin ─────────────────────────────────────────────────────────────────────
    "/admin/push-notifications": {
        get: {
            tags: ["Push Notifications"],
            summary: "List all push notification campaigns (all shops)",
            description: "Returns campaigns across all shops, sorted newest first. Filter by `shop_id` to scope to one shop. Platform-wide admin campaigns have `shop_id: null`.",
            security,
            parameters: [
                { in: "query", name: "limit",   schema: { type: "integer", default: 20 } },
                { in: "query", name: "skip",    schema: { type: "integer", default: 0 } },
                { in: "query", name: "shop_id", schema: { type: "integer" }, description: "Filter by shop" },
            ],
            responses: {
                200: listResponse(),
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — missing PUSH_NOTIF_GET permission" },
            },
        },
        post: {
            tags: ["Push Notifications"],
            summary: "Send a platform-wide push notification (admin, no quota)",
            description: "Broadcasts to ALL users with registered FCM device tokens. No shop association, no quota limit. `shop_id` will be `null` in the campaign record.",
            security,
            requestBody: sendBody,
            responses: {
                201: campaignResponse,
                400: { description: "title or body missing" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — missing PUSH_NOTIF_POST permission" },
            },
        },
    },

    // ── Seller ────────────────────────────────────────────────────────────────────
    "/seller/push-notifications": {
        get: {
            tags: ["Seller"],
            summary: "List own push notification campaigns + monthly quota",
            description: "Returns the shop's campaign history alongside `used` (sends this calendar month) and `quota` (from the active plan). `quota = 0` means push notifications are not available on the current plan.",
            security,
            parameters: [
                { in: "query", name: "limit",  schema: { type: "integer", default: 20, maximum: 100 } },
                { in: "query", name: "offset", schema: { type: "integer", default: 0 } },
            ],
            responses: {
                200: listResponse({
                    used:  { type: "integer", example: 3, description: "Campaigns sent this calendar month" },
                    quota: { type: "integer", example: 10, description: "Monthly limit from active plan (0 = not available)" },
                }),
                401: { description: "Unauthorized" },
                403: { description: "No active approved shop" },
            },
        },
        post: {
            tags: ["Seller"],
            summary: "Send a push notification to all users (quota-checked)",
            description: "Broadcasts to ALL users with registered FCM device tokens. Enforces the shop's monthly `push_notif_monthly` plan quota. Returns 403 if the plan does not include push notifications or the monthly limit is reached.",
            security,
            requestBody: sendBody,
            responses: {
                201: campaignResponse,
                400: { description: "title or body missing" },
                401: { description: "Unauthorized" },
                403: {
                    description: "Plan does not include push notifications, or monthly limit reached",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                },
            },
        },
    },
};
