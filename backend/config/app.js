const express = require("express");
const path    = require("path");
const helmet  = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cron = require("node-cron");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config({ path: process.env.ENV_FILE || ".env" });

const errorMiddleware = require("../middlewares/error-middleware");
const extMiddleware = require("../middlewares/external-middleware");
const cookieParser = require("../middlewares/cookie-parser-middleware");
const loggerMiddleware = require("../middlewares/logger-middleware");
const configMiddleware = require("../middlewares/config-middleware");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");

const adminRouter  = require("../routes/admin");
const authRouter   = require("../routes/auth/auth");
const sellerRouter = require("../routes/seller");
const buyerRouter  = require("../routes/buyer");

const { CONSTANTS } = require("./constants");

const app = express();
// const { createRedisClient, redisMiddleware, bindRedisClient } = require("../utils/redis/redis-client");

// Uncomment this for set up cors security
var allowlist = ["http://localhost:3000"];
var corsOptionsDelegate = function (req, callback) {
  var corsOptions = {
    origin: false,
    credentials: true,
  };
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions.origin = true;
  }
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    proxy: allowlist,
  })
);

// This parses incoming requests with JSON payloads and is based on body-parser
app.use(express.json({ limit: "100mb" }));

// Helmet for the secure app by adding some headers
app.use(helmet());

// Morgan is HTTP logging library
app.use(morgan("common"));


/**
 * Bind Redis client to req.redis
 */
// bindRedisClient(app).catch(console.error);

app.use('*', configMiddleware());

//Parse cookie string to object
app.use("*", cookieParser);

cron.schedule("0 0 * * *", async () => {
  // Register daily jobs here
});


// Serve uploaded media files
app.use(
  "/media",
  (req, res, next) => { res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); next() },
  cors(corsOptionsDelegate),
  express.static(path.resolve(process.cwd(), "storage", "media"), {
    dotfiles: "ignore",
    etag: true,
    maxAge: "7d",
  })
);

// Configure static folder
app.use(
  "/static",
  cors(corsOptionsDelegate),
  express.static(CONSTANTS.PUBLIC_FOLDER, {
    dotfiles: "ignore",
    etag: false,
    index: ["index.html"],
    maxAge: "1d",
    redirect: "/",
  })
);

// API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "mbium API Docs",
    swaggerOptions: { persistAuthorization: true },
}));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// Authenticate user by accesstoken
app.use("/auth",   authRouter);
app.use("/admin",  adminRouter);
app.use("/seller", sellerRouter);
app.use("/buyer",  buyerRouter);
app.use(errorMiddleware);
app.use("*", loggerMiddleware);

module.exports = { app };