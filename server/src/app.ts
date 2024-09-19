import swaggerUi from "swagger-ui-express";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { rateLimit } from "express-rate-limit";
import requestIp from "request-ip";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Server } from "socket.io";
import passport from "passport";
import morganMiddleware from "./logger/morgan.logger";
import { ApiError } from "./utils/ApiError";
import { initializeSocketIO } from "./socket";
import { router } from "./routes/v1/index";
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set("io", io);
// global middlewares
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*"
        : process.env.CORS_ORIGIN?.split(","),
    credentials: true,
  })
);

app.use(requestIp.mw());

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.clientIp || "unknown";
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

app.use(limiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // configure static file to save images locally
app.use(cookieParser());

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET || "dev",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use("/api/v1", router);
app.use(morganMiddleware);

initializeSocketIO(io);

export { httpServer };
