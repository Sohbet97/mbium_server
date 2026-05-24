const components       = require("./components");
const authPaths        = require("./paths/auth");
const usersPaths       = require("./paths/users");
const shopsPaths       = require("./paths/shops");
const catalogPaths     = require("./paths/catalog");
const collectionsPaths = require("./paths/collections");
const ordersPaths      = require("./paths/orders");
const reviewsPaths     = require("./paths/reviews");
const discountsPaths   = require("./paths/discounts");
const payoutsPaths     = require("./paths/payouts");
const disputesPaths    = require("./paths/disputes");
const mediaPaths       = require("./paths/media");
const bannersPaths     = require("./paths/banners");
const deliversPaths    = require("./paths/delivers");
const plansPaths       = require("./paths/plans");
const notifPaths       = require("./paths/notifications");
const locationsPaths   = require("./paths/locations");
const sellerPaths      = require("./paths/seller");
const buyerPaths       = require("./paths/buyer");
const aiRecPaths       = require("./paths/ai-recommendations");
const pushNotifPaths   = require("./paths/push-notifications");
const aiChatPaths      = require("./paths/ai-chat");
const supportPaths     = require("./paths/support");

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "mbium API",
        version: "1.0.0",
        description:
            "Marketplace backend API for the Turkmenistan market. " +
            "All `/admin/*` routes require a Bearer token unless stated otherwise. " +
            "All `/seller/*` routes require a Bearer token AND an active approved shop. " +
            "Most `/buyer/*` routes are public; cart/orders/addresses/reviews require a Bearer token. " +
            "Obtain tokens via `POST /auth/login` → `POST /auth/verify-otp`.",
        contact: { name: "mbium dev", email: "dovletli.dev@gmail.com" },
    },
    servers: [
        { url: "http://localhost:4000", description: "Local dev" },
        { url: "http://216.250.11.232/api", description: "Mbium server" },
    ],
    security: [],
    components: {
        securitySchemes: components.securitySchemes,
        schemas: components.schemas,
    },
    tags: [
        // Auth & Users
        { name: "Auth",          description: "Authentication, OTP, sessions, and self-service profile" },
        { name: "Users",         description: "User management and roles" },
        // Admin — core
        { name: "Shops",         description: "Shop CRUD, shop types, members, verification, and shop applications" },
        { name: "Catalog",       description: "Categories, products, and variants" },
        { name: "Collections",   description: "Curated product collections" },
        { name: "Media",         description: "Media library upload, management, and product attachment" },
        { name: "Banners",       description: "Banner types and banner CRUD with scheduling" },
        { name: "Orders",        description: "Order placement, lifecycle, shipments, and delivery addresses" },
        { name: "Reviews",       description: "Product reviews, moderation, and seller replies" },
        { name: "Discounts",     description: "Discount codes and coupon management" },
        { name: "Flash Sales",   description: "Time-limited flash sale campaigns" },
        { name: "Payouts",       description: "Seller payout requests and balance tracking" },
        { name: "Disputes",      description: "Order dispute management" },
        { name: "Delivers",      description: "Platform delivery driver management" },
        { name: "Plans",         description: "Subscription plans and shop subscription management" },
        { name: "Notifications", description: "Admin in-app notification inbox" },
        { name: "Locations",     description: "Countries, regions, districts, villages, and cities" },
        // Seller panel
        { name: "Seller",             description: "Seller-panel routes — require auth + active approved shop" },
        // Buyer (mobile app)
        { name: "Buyer — Catalog",    description: "Public product/category/shop/collection browse (no auth)" },
        { name: "Buyer — Discounts",  description: "Public coupon validation" },
        { name: "Buyer — Cart",       description: "Shopping cart — requires auth" },
        { name: "Buyer — Orders",     description: "Order placement and tracking — requires auth" },
        { name: "Buyer — Addresses",  description: "Delivery address book — requires auth" },
        { name: "Buyer — Reviews",    description: "Product reviews — requires auth" },
        { name: "Buyer — AI",         description: "AI agent suggestion cards — public" },
        // Admin — AI
        { name: "AI Recommendations", description: "Admin CRUD for AI agent suggestion cards" },
        { name: "AI Chat",            description: "Streaming AI chat (SSE) and persistent conversation history — admin and buyer" },
        { name: "Admin Support",      description: "Admin-side support inbox — list/search rooms, start new conversations, send replies" },
        { name: "Push Notifications", description: "FCM push notification campaigns — admin (no quota) and seller (plan-quota enforced)" },
    ],
    paths: {
        // Auth
        ...authPaths,
        // Admin
        ...usersPaths,
        ...shopsPaths,
        ...catalogPaths,
        ...collectionsPaths,
        ...mediaPaths,
        ...bannersPaths,
        ...ordersPaths,
        ...reviewsPaths,
        ...discountsPaths,
        ...payoutsPaths,
        ...disputesPaths,
        ...deliversPaths,
        ...plansPaths,
        ...notifPaths,
        ...locationsPaths,
        // Seller panel
        ...sellerPaths,
        // Buyer (mobile app)
        ...buyerPaths,
        // Admin — AI Recommendations
        ...aiRecPaths,
        // AI Chat (admin + buyer) and conversation history
        ...aiChatPaths,
        // Admin Support inbox
        ...supportPaths,
        // Push Notifications (admin + seller)
        ...pushNotifPaths,
    },
};

module.exports = swaggerSpec;
