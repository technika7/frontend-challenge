/**
 * @file index.ts
 * @description Hono backend server entry point for the MRF Generation API.
 *
 * Serves:
 *  - REST API under /api/mrf/*
 *  - Static MRF JSON files under /mrf-files/* (for public download)
 *
 * CORS is enabled for local development (frontend on :5173, backend on :8080).
 */

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import mrfRoutes from "./routes/mrf.routes.js";

const app = new Hono();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/** Log every request to stdout for observability during development */
app.use("*", logger());

/** Pretty-print JSON responses when ?pretty is appended to any URL */
app.use("*", prettyJSON());

/**
 * CORS: allow the Vite dev server (and any other origin in development).
 * In production this should be locked down to your actual domain.
 */
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ---------------------------------------------------------------------------
// Static file serving — expose generated MRF JSON files for public download
// ---------------------------------------------------------------------------

/**
 * Serve the `mrf-files/` directory at /mrf-files/* so that the public
 * MRF listing page can link directly to downloadable JSON files.
 */
app.use(
  "/mrf-files/*",
  serveStatic({
    root: "./",
    rewriteRequestPath: (path) => path,
  })
);

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

/** Mount the MRF route group under the /api/mrf prefix */
app.route("/api/mrf", mrfRoutes);

/** Health check endpoint */
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "MRF Generation API",
    timestamp: new Date().toISOString(),
  });
});

/** Catch-all 404 handler */
app.notFound((c) => {
  return c.json({ success: false, error: "Route not found" }, 404);
});

/** Global error handler */
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      success: false,
      error: "Internal server error",
      message: err.message,
    },
    500
  );
});

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port: PORT });
console.log(`\n🚀 MRF Generation API is running on http://localhost:${PORT}`);
console.log(`   Health check: http://localhost:${PORT}/health`);
console.log(`   MRF files:    http://localhost:${PORT}/mrf-files/\n`);
