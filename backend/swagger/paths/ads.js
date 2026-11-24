// Ad tasks ("Mugt mbium gazan"): shops pay a TMT budget, users earn coins for follow / reel like / review.
const json = (schema) => ({ content: { "application/json": { schema } } });
const security = [{ BearerAuth: [] }];
const idParam = { in: "path", name: "id", required: true, schema: { type: "integer" } };
const pageParams = [
    { in: "query", name: "page",  schema: { type: "integer", default: 1 } },
    { in: "query", name: "limit", schema: { type: "integer" } },
];

const taskType = {
    type: "object",
    properties: {
        id: { type: "integer" },
        code: { type: "string", enum: ["review", "reel_like", "shop_follow"], description: "Backend action this type pays for" },
        name: { type: "string" }, name_ru: { type: "string" }, name_eng: { type: "string" },
        target_type: { type: "string", enum: ["shop", "product", "reel"], description: "Derived from code" },
        min_price: { type: "number", example: 0.5 },
        needs_moderation: { type: "boolean" },
        status: { type: "boolean" },
    },
};
const campaignTask = {
    type: "object",
    properties: {
        id: { type: "integer" }, task_type_id: { type: "integer" }, code: { type: "string" },
        name: { type: "string" }, name_ru: { type: "string" }, name_eng: { type: "string" },
        price: { type: "number", example: 0.5 }, ball: { type: "integer", example: 5 },
        scope: { type: "string", enum: ["all", "selected"], nullable: true },
        target_ids: { type: "array", items: { type: "integer" }, nullable: true },
        limit: { type: "integer", nullable: true, description: "null = no limit" },
        done_count: { type: "integer" }, pending_count: { type: "integer" },
        spent: { type: "number" },
        remaining_count: { type: "integer", description: "min(limit − done − pending, floor(remaining / price))" },
    },
};
const campaign = {
    type: "object",
    properties: {
        id: { type: "integer", example: 17 },
        status: { type: "string", enum: ["pending", "active", "rejected", "finished"] },
        shop: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, logo: { type: "string" } } },
        budget: { type: "number", example: 200 }, user_percent: { type: "integer", example: 60 },
        user_pool: { type: "number", example: 120 }, platform_fee: { type: "number", example: 80 },
        spent: { type: "number", example: 75 }, reserved: { type: "number", example: 0 },
        remaining: { type: "number", example: 45, description: "user_pool − spent − reserved" },
        users_count: { type: "integer", description: "Detail only: unique users with a non-rejected completion" },
        comment: { type: "string", nullable: true },
        created_at: { type: "string", format: "date-time" }, approved_at: { type: "string", format: "date-time", nullable: true },
        finished_at: { type: "string", format: "date-time", nullable: true },
        tasks: { type: "array", items: campaignTask },
    },
};
const completion = {
    type: "object",
    properties: {
        id: { type: "integer" }, campaign_id: { type: "integer" },
        shop: { type: "object" }, user: { type: "object" },
        task: { type: "object", description: "Task type of the completion (code, names, target_type)" },
        target_id: { type: "integer", description: "Shop, product or reel id" },
        review: { type: "object", nullable: true, description: "Review tasks: rating, comment, product_id" },
        status: { type: "string", enum: ["pending", "approved", "rejected"] },
        price: { type: "number", description: "Not returned to buyers" }, ball: { type: "integer" },
        comment: { type: "string", nullable: true },
        created_at: { type: "string", format: "date-time" }, moderated_at: { type: "string", format: "date-time", nullable: true },
    },
};
const buyerCampaign = {
    type: "object",
    properties: {
        id: { type: "integer" },
        shop: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, logo: { type: "string" } } },
        max_ball: { type: "integer" },
        tasks: { type: "array", items: { type: "object", properties: {
            id: { type: "integer" }, code: { type: "string" },
            name: { type: "string" }, name_ru: { type: "string" }, name_eng: { type: "string" },
            target_type: { type: "string" }, ball: { type: "integer" },
            scope: { type: "string", nullable: true }, target_ids: { type: "array", items: { type: "integer" } },
            available: { type: "boolean" },
            my_status: { type: "string", enum: ["pending", "approved"], nullable: true },
            my_target_ids: { type: "array", items: { type: "integer" }, description: "Objects this user already completed" },
        } } },
    },
};
const list = (items) => ({ type: "object", properties: { data: { type: "array", items }, count: { type: "integer" } } });
const model = (schema) => ({ type: "object", properties: { model: schema } });

const A = "Admin — Ads";
const S = "Seller — Ads";
const B = "Buyer — Ads";

module.exports = {
    // ── Admin ────────────────────────────────────────────────────────────────
    "/admin/ad/settings": {
        get: { tags: [A], summary: "Ad settings", security, responses: { 200: { description: "{ min_budget, ball_rate }" } } },
        put: {
            tags: [A], summary: "Update ad settings", security,
            description: "ball_rate = TMT per coin paid to users (0.10 → a 0.50 TMT task pays 5 coins). Affects new campaigns only; running campaigns keep their task's coins.",
            requestBody: { required: true, ...json({ type: "object", properties: { min_budget: { type: "number", example: 100 }, ball_rate: { type: "number", example: 0.1 } } }) },
            responses: { 200: { description: "Saved settings" }, 400: { description: "Invalid value" } },
        },
    },
    "/admin/ad/task-type": {
        get: { tags: [A], summary: "List task types", security, responses: { 200: { description: "Task types", ...json(list(taskType)) } } },
        post: {
            tags: [A], summary: "Create a task type", security,
            requestBody: { required: true, ...json({ type: "object", required: ["code", "name", "min_price"], properties: {
                code: { type: "string", enum: ["review", "reel_like", "shop_follow"] }, name: { type: "string" },
                name_ru: { type: "string" }, name_eng: { type: "string" }, min_price: { type: "number" },
                needs_moderation: { type: "boolean" }, status: { type: "boolean" },
            } }) },
            responses: { 201: { description: "Created", ...json(model(taskType)) }, 400: { description: "Invalid code / price" } },
        },
    },
    "/admin/ad/task-type/{id}": {
        put: {
            tags: [A], summary: "Update names, min_price, needs_moderation, status", security, parameters: [idParam],
            description: "code and target_type can't change. A new min_price applies only to new campaigns.",
            requestBody: { required: true, ...json(taskType) },
            responses: { 200: { description: "Updated", ...json(model(taskType)) }, 404: { description: "Not found" } },
        },
        delete: {
            tags: [A], summary: "Delete a task type (only switched off if a campaign already used it)", security, parameters: [idParam],
            responses: { 200: { description: "{ deleted, disabled }" }, 404: { description: "Not found" } },
        },
    },
    "/admin/ad/campaign": {
        get: {
            tags: [A], summary: "All campaigns", security,
            parameters: [...pageParams, { in: "query", name: "status", schema: { type: "string", enum: ["pending", "active", "rejected", "finished"] } }, { in: "query", name: "shop_id", schema: { type: "integer" } }],
            responses: { 200: { description: "Campaigns", ...json(list(campaign)) } },
        },
    },
    "/admin/ad/campaign/{id}": {
        get: { tags: [A], summary: "One campaign with statistics", security, parameters: [idParam], responses: { 200: { description: "Campaign", ...json(model(campaign)) }, 404: { description: "Not found" } } },
        put: {
            tags: [A], summary: "Approve or reject a pending campaign", security, parameters: [idParam],
            description: "pending → active starts the campaign (platform share kept). pending → rejected refunds the whole budget to the shop balance.",
            requestBody: { required: true, ...json({ type: "object", required: ["status"], properties: { status: { type: "string", enum: ["active", "rejected"] }, comment: { type: "string" } } }) },
            responses: { 200: { description: "Updated", ...json(model(campaign)) }, 405: { description: "Campaign is not pending" } },
        },
    },
    "/admin/ad/completion": {
        get: {
            tags: [A], summary: "Completions (moderation queue)", security,
            parameters: [...pageParams, { in: "query", name: "status", schema: { type: "string", enum: ["pending", "approved", "rejected"] } }, { in: "query", name: "campaign_id", schema: { type: "integer" } }],
            responses: { 200: { description: "Completions", ...json(list(completion)) } },
        },
    },
    "/admin/ad/completion/{id}": {
        put: {
            tags: [A], summary: "Approve or reject a pending completion", security, parameters: [idParam],
            description: "Approve: reserve → spent, coins credited. Reject: reserve returns to the pool; the user may do the task again.",
            requestBody: { required: true, ...json({ type: "object", required: ["status"], properties: { status: { type: "string", enum: ["approved", "rejected"] }, comment: { type: "string" } } }) },
            responses: { 200: { description: "Updated" }, 405: { description: "Already moderated" } },
        },
    },

    // ── Seller ───────────────────────────────────────────────────────────────
    "/seller/ad/task-type": {
        get: {
            tags: [S], summary: "Active task types + this shop's ad terms", security,
            responses: { 200: { description: "Types and terms", ...json({ type: "object", properties: {
                data: { type: "array", items: taskType },
                allowed: { type: "boolean", description: "Plan has ads_dashboard and revenue_share_user > 0" },
                plan: { type: "object", nullable: true }, user_percent: { type: "integer", example: 60 },
                min_budget: { type: "number", example: 100 }, ball_rate: { type: "number", example: 0.1 },
            } }) } },
        },
    },
    "/seller/ad/campaign": {
        get: { tags: [S], summary: "This shop's campaigns", security, parameters: pageParams, responses: { 200: { description: "Campaigns", ...json(list(campaign)) } } },
        post: {
            tags: [S], summary: "Create a campaign (status pending)", security,
            description: "The budget is debited from the shop's available balance right away (400 if it's too low). Checks: budget ≥ min_budget; price ≥ the type's min_price and a multiple of ball_rate; Σ price × limit over limited tasks ≤ user pool; target_ids belong to the shop. Plans without ads get 405 AD_PLAN_NOT_ALLOWED.",
            requestBody: { required: true, ...json({ type: "object", required: ["budget", "tasks"], properties: {
                budget: { type: "number", example: 200 },
                tasks: { type: "array", items: { type: "object", required: ["task_type_id", "price"], properties: {
                    task_type_id: { type: "integer" }, price: { type: "number", example: 0.5 },
                    scope: { type: "string", enum: ["all", "selected"], description: "Ignored for shop_follow" },
                    target_ids: { type: "array", items: { type: "integer" } },
                    limit: { type: "integer", nullable: true },
                } } },
            } }) },
            responses: { 201: { description: "Created", ...json(model(campaign)) }, 400: { description: "Validation error or low balance" }, 405: { description: "Plan doesn't allow ads" } },
        },
    },
    "/seller/ad/campaign/{id}": {
        get: { tags: [S], summary: "Ad dashboard: full campaign statistics", security, parameters: [idParam], responses: { 200: { description: "Campaign", ...json(model(campaign)) }, 404: { description: "Not found or another shop's" } } },
    },
    "/seller/ad/campaign/{id}/completion": {
        get: { tags: [S], summary: "Who completed what", security, parameters: [idParam, ...pageParams], responses: { 200: { description: "Completions", ...json(list(completion)) } } },
    },

    // ── Buyer ────────────────────────────────────────────────────────────────
    "/buyer/ad/campaign": {
        get: {
            tags: [B], summary: "\"Mugt mbium gazan\": active campaigns", parameters: pageParams,
            description: "Auth optional (my_status needs it). Only tasks that can still be paid are listed; campaigns with none are left out. No money figures are returned.",
            responses: { 200: { description: "Campaigns", ...json(list(buyerCampaign)) } },
        },
    },
    "/buyer/ad/campaign/{id}": {
        get: { tags: [B], summary: "A campaign's tasks and what this user already did", parameters: [idParam], responses: { 200: { description: "Campaign", ...json(model(buyerCampaign)) }, 404: { description: "Not active" } } },
    },
    "/buyer/ad/history": {
        get: { tags: [B], summary: "Coins earned from ad tasks, incl. pending moderation", security, parameters: pageParams, responses: { 200: { description: "Completions (without price)", ...json(list(completion)) } } },
    },
};
