const tag      = "PendingCounts";
const security = [{ BearerAuth: [] }];

module.exports = {
    "/admin/pending-counts": {
        get: {
            tags: [tag],
            summary: "Per-resource pending counts for the admin sidebar's red badges",
            description: "Each field is present only when the caller holds the matching GET permission (e.g. `products` requires PRODUCT_GET, `kyc` requires KYC_GET).",
            security,
            responses: {
                200: {
                    description: "Pending counts",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: {
                                        type: "object",
                                        properties: {
                                            products:         { type: "integer", description: "products.moderation_status = 0" },
                                            reels:            { type: "integer", description: "reels.moderation_status = 0" },
                                            shopApplications: { type: "integer", description: "shops.verification_status = 1" },
                                            shopTypeRequests: { type: "integer", description: "shop_type_change_requests.status = 0" },
                                            kyc:              { type: "integer", description: "kyc_documents.status = 'pending'" },
                                            disputes:         { type: "integer", description: "disputes.status = 'OPEN'" },
                                            payoutRequests:   { type: "integer", description: "payout_requests.status = 'PENDING'" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    "/seller/pending-counts": {
        get: {
            tags: [tag],
            summary: "Pending counts for the active shop, for the seller sidebar's red badges",
            description: "All fields are scoped to the caller's active shop (req.shop.id).",
            security,
            responses: {
                200: {
                    description: "Pending counts",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: {
                                        type: "object",
                                        properties: {
                                            products:         { type: "integer", description: "This shop's products.moderation_status = 0" },
                                            reels:            { type: "integer", description: "This shop's reels.moderation_status = 0" },
                                            payoutRequests:   { type: "integer", description: "This shop's payout_requests.status = 'PENDING'" },
                                            shopTypeRequests: { type: "integer", description: "This shop's shop_type_change_requests.status = 0" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
