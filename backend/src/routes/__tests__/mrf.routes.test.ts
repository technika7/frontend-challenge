import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import mrfRoutes from "../mrf.routes.js";

// Create a mock Hono app and mount the routes for testing
const app = new Hono();
app.route("/api/mrf", mrfRoutes);

describe("MRF API Routes", () => {
  describe("GET /api/mrf/files", () => {
    it("should return a success response (even if empty initially)", async () => {
      const res = await app.request("/api/mrf/files");
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.files)).toBe(true);
    });
  });

  describe("GET /api/mrf/files/:customer", () => {
    it("should return 400 for an invalid customer identifier (regex validation)", async () => {
      // Sending an invalid character to test the alphanumeric regex
      const res = await app.request("/api/mrf/files/invalid@customer!");
      expect(res.status).toBe(400);
      
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Invalid customer identifier");
    });

    it("should return success (with empty files) for a non-existent valid customer", async () => {
      // Requesting a non-existent group ID should gracefully return an empty array
      const res = await app.request("/api/mrf/files/NON_EXISTENT_GROUP_123");
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.customer).toBe("NON_EXISTENT_GROUP_123");
      expect(body.files).toEqual([]);
    });
  });

  describe("POST /api/mrf/generate", () => {
    it("should reject invalid payloads with 422 Unprocessable Entity", async () => {
      const res = await app.request("/api/mrf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claims: [{ invalid: "data" }] }), // Missing required fields
      });
      
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Validation failed");
    });
  });
});
