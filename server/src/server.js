import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import dns from "node:dns";

import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import searchRoutes from "./routes/search.js";
import dataRoutes from "./routes/data.js";
import businessRoutes from "./routes/business.js";
import aiRoutes from "./routes/ai.js";
import feedbackRoutes from "./routes/feedback.js";
import { authenticate } from "./middleware/authenticate.js";

// DNS configuration
dns.setServers(["8.8.8.8"]);

const app = express();
const port = Number(process.env.PORT || 5000);

app.disable("x-powered-by");

// Render runs behind a proxy.
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// ==========================================
// SPYRIX CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean),

  // Production frontend
  "https://spyrix-update.vercel.app",

  // Local development
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header, such as server-to-server calls.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/+$/, "");

      const localViteOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1):51[0-9]{2}$/.test(
          normalizedOrigin,
        );

      if (allowedOrigins.includes(normalizedOrigin) || localViteOrigin) {
        return callback(null, true);
      }

      console.error(`[CORS] Blocked origin: ${origin}`);

      return callback(
        new Error("Origin is not allowed by SPYRIX API CORS policy."),
      );
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],

    optionsSuccessStatus: 204,
  }),
);

// Parse JSON requests
app.use(express.json({ limit: "5mb" }));

// ==========================================
// RATE LIMITING
// ==========================================

app.use(
  "/api/v1/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ==========================================
// HEALTH AND READINESS
// ==========================================

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "spyrix-invoice-api",
  });
});

app.get("/ready", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;

  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "waiting_for_database",
    database: ready ? "connected" : "disconnected",
  });
});

// ==========================================
// DATABASE AVAILABILITY CHECK
// ==========================================

app.use("/api/v1", (req, res, next) => {
  // Feedback does not require the database.
  if (req.path === "/feedback" || req.path.startsWith("/feedback/")) {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        "The SPYRIX database is still connecting. Please try again in a moment.",
    });
  }

  return next();
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/feedback", feedbackRoutes);

app.use("/api/v1/dashboard", authenticate, dashboardRoutes);

app.use("/api/v1/search", authenticate, searchRoutes);

app.use("/api/v1/data", authenticate, dataRoutes);

app.use("/api/v1/business", authenticate, businessRoutes);

app.use("/api/v1/ai", authenticate, aiRoutes);

// ==========================================
// NOT FOUND HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((error, _req, res, _next) => {
  console.error("[SPYRIX API ERROR]", error);

  if (error?.code === 11000) {
    return res.status(409).json({
      message: "A record with this value already exists.",
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      message: "Some submitted values are invalid.",
    });
  }

  const status = error.status || 500;

  return res.status(status).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Server error. Please try again."
        : error.message || "Server error.",
  });
});

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(port, () => {
  console.log(`SPYRIX API listening on port ${port}`);
});

let stopping = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// MONGODB CONNECTION WITH RETRY
// ==========================================

async function connectDatabaseWithRetry() {
  while (!stopping && mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();

      console.log("[SPYRIX API] Database is ready.");

      return;
    } catch (error) {
      const missingUri = !String(process.env.MONGODB_URI || "").trim();

      console.error(`[SPYRIX API] MongoDB connection failed: ${error.message}`);

      if (missingUri) {
        console.error(
          "[SPYRIX API] Add MONGODB_URI to server/.env or Render environment variables.",
        );
      }

      await wait(missingUri ? 15000 : 5000);
    }
  }
}

connectDatabaseWithRetry();

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

async function shutdown(signal) {
  if (stopping) return;

  stopping = true;

  console.log(`[SPYRIX API] ${signal} received. Shutting down.`);

  server.close(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
