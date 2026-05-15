const components = require("./components");
const authPaths = require("./paths/auth");
const usersPaths = require("./paths/users");
const shopsPaths = require("./paths/shops");
const catalogPaths = require("./paths/catalog");
const ordersPaths = require("./paths/orders");
const reviewsPaths = require("./paths/reviews");

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
    ],
    security: [],
    components: {
        securitySchemes: components.securitySchemes,
        schemas: components.schemas,
    },
    tags: [
        { name: "Auth", description: "Authentication, OTP, sessions" },
        { name: "Users", description: "User management and roles" },
        { name: "Shops", description: "Shop and shop-type management" },
        { name: "Catalog", description: "Categories, products, variants and images" },
        { name: "Cart", description: "Shopping cart" },
        { name: "Orders", description: "Order placement and lifecycle" },
        { name: "Reviews", description: "Product reviews and moderation" },
    ],
    paths: {
        ...authPaths,
        ...usersPaths,
        ...shopsPaths,
        ...catalogPaths,
        ...ordersPaths,
        ...reviewsPaths,
    },
};

module.exports = swaggerSpec;
