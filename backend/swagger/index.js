const components = require("./components");
const authPaths = require("./paths/auth");
const usersPaths = require("./paths/users");
const shopsPaths = require("./paths/shops");
const catalogPaths = require("./paths/catalog");
const collectionsPaths = require("./paths/collections");
const ordersPaths = require("./paths/orders");
const reviewsPaths = require("./paths/reviews");
const discountsPaths = require("./paths/discounts");
const payoutsPaths = require("./paths/payouts");
const disputesPaths = require("./paths/disputes");
const mediaPaths = require("./paths/media");
const bannersPaths = require("./paths/banners");
const deliversPaths = require("./paths/delivers");

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "mbium API",
        version: "1.0.0",
        description:
            "Marketplace backend API for the Turkmenistan market. " +
            "All `/admin/*` routes require a Bearer token unless stated otherwise. " +
            "Obtain tokens via `POST /auth/login` → `POST /auth/verify-otp`.",
        contact: { name: "mbium dev", email: "dovletli.dev@gmail.com" },
    },
    servers: [
        { url: "http://localhost:5000", description: "Local dev" },
        { url: "http://216.250.11.232/api", description: "Mbium server" },
    ],
    security: [],
    components: {
        securitySchemes: components.securitySchemes,
        schemas: components.schemas,
    },
    tags: [
        { name: "Auth",        description: "Authentication, OTP, sessions, and self-service profile" },
        { name: "Users",       description: "User management and roles" },
        { name: "Shops",       description: "Shop CRUD, shop types, members, verification, and shop application" },
        { name: "Catalog",     description: "Categories, products, and variants" },
        { name: "Collections", description: "Curated product collections" },
        { name: "Media",       description: "Media library upload, management, and product attachment" },
        { name: "Banners",     description: "Banner types and banner CRUD with scheduling" },
        { name: "Cart",        description: "Shopping cart" },
        { name: "Orders",      description: "Order placement, lifecycle, shipments, and delivery addresses" },
        { name: "Reviews",     description: "Product reviews, moderation, and seller replies" },
        { name: "Discounts",   description: "Discount codes and coupon management" },
        { name: "Flash Sales", description: "Time-limited flash sale campaigns" },
        { name: "Payouts",     description: "Seller payout requests and balance tracking" },
        { name: "Disputes",    description: "Order dispute management" },
        { name: "Delivers",    description: "Platform delivery driver management" },
    ],
    paths: {
        ...authPaths,
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
    },
};

module.exports = swaggerSpec;
