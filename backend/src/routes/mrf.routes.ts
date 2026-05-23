/**
 * @file mrf.routes.ts
 * @description Hono route group for all MRF-related API endpoints.
 *
 * Endpoints:
 *   POST /api/mrf/generate  — Validate claims, generate MRF JSON files, write to disk
 *   GET  /api/mrf/files     — List all generated MRF files (metadata only)
 *   GET  /api/mrf/files/:customer — List MRF files for a specific customer group
 */

import { Hono } from "hono";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MrfGenerationRequestSchema } from "../schemas/claim.schema.js";
import { MrfGeneratorContext } from "../services/mrf-generator.js";

// Resolve the directory where MRF files are persisted on disk
// Files are organized as:  mrf-files/{groupId}/{year-month}.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MRF_FILES_DIR = path.resolve(__dirname, "../../mrf-files");

// Ensure the base MRF output directory exists at startup
await fs.mkdir(MRF_FILES_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Route group
// ---------------------------------------------------------------------------

const mrfRoutes = new Hono();

// ---------------------------------------------------------------------------
// POST /generate — Validate, generate, and persist MRF JSON files
// ---------------------------------------------------------------------------

mrfRoutes.post("/generate", async (c) => {
  // 1. Parse request body
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  // 2. Validate with Zod
  const parseResult = MrfGenerationRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors,
      },
      422
    );
  }

  const { claims } = parseResult.data;

  // 3. Run the Strategy-based MRF generator
  const generator = new MrfGeneratorContext();
  const mrfDocuments = generator.generate(claims);

  // 4. Write each generated document to disk
  const generatedFiles: string[] = [];

  for (const [fileKey, document] of mrfDocuments) {
    // fileKey is like "ACM001/2024-10" → maps to mrf-files/ACM001/2024-10.json
    const filePath = path.join(MRF_FILES_DIR, `${fileKey}.json`);
    const fileDir = path.dirname(filePath);

    // Ensure customer subdirectory exists
    await fs.mkdir(fileDir, { recursive: true });

    // Serialize and write the MRF document
    await fs.writeFile(filePath, JSON.stringify(document, null, 2), "utf-8");
    generatedFiles.push(`${fileKey}.json`);
  }

  return c.json({
    success: true,
    message: `Generated ${generatedFiles.length} MRF file(s)`,
    files: generatedFiles,
    claimsProcessed: claims.length,
  });
});

// ---------------------------------------------------------------------------
// GET /files — Return metadata for all MRF files across all customers
// ---------------------------------------------------------------------------

mrfRoutes.get("/files", async (c) => {
  try {
    const allFiles = await collectAllMrfFiles(MRF_FILES_DIR);
    return c.json({ success: true, files: allFiles });
  } catch (err) {
    console.error("Error listing MRF files:", err);
    return c.json({ success: false, error: "Failed to list MRF files" }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /files/:customer — Return MRF files for a specific customer group ID
// ---------------------------------------------------------------------------

mrfRoutes.get("/files/:customer", async (c) => {
  const customer = c.req.param("customer");

  // Sanitize: only allow alphanumeric characters and hyphens to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(customer)) {
    return c.json({ success: false, error: "Invalid customer identifier" }, 400);
  }

  const customerDir = path.join(MRF_FILES_DIR, customer);

  try {
    const stat = await fs.stat(customerDir);
    if (!stat.isDirectory()) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }

    const files = await fs.readdir(customerDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const fileMetadata = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const filePath = path.join(customerDir, fileName);
        const stat = await fs.stat(filePath);
        return {
          customer,
          fileName,
          /** URL path to download the file via the /mrf-files static endpoint */
          url: `/mrf-files/${customer}/${fileName}`,
          yearMonth: fileName.replace(".json", ""),
          sizeBytes: stat.size,
          lastModified: stat.mtime.toISOString(),
        };
      })
    );

    return c.json({ success: true, customer, files: fileMetadata });
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return c.json({ success: true, customer, files: [] });
    }
    console.error("Error listing customer MRF files:", err);
    return c.json(
      { success: false, error: "Failed to list customer MRF files" },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// Helper: Recursively collect all MRF file metadata from disk
// ---------------------------------------------------------------------------

interface MrfFileMeta {
  customer: string;
  fileName: string;
  url: string;
  yearMonth: string;
  sizeBytes: number;
  lastModified: string;
}

async function collectAllMrfFiles(baseDir: string): Promise<MrfFileMeta[]> {
  const result: MrfFileMeta[] = [];

  // List top-level directories (one per customer group)
  let customerDirs: string[] = [];
  try {
    customerDirs = await fs.readdir(baseDir);
  } catch {
    return result; // Base directory empty or missing — return empty list
  }

  for (const customer of customerDirs) {
    const customerPath = path.join(baseDir, customer);
    const stat = await fs.stat(customerPath);
    if (!stat.isDirectory()) continue;

    const files = await fs.readdir(customerPath);
    for (const fileName of files) {
      if (!fileName.endsWith(".json")) continue;
      const filePath = path.join(customerPath, fileName);
      const fileStat = await fs.stat(filePath);
      result.push({
        customer,
        fileName,
        url: `/mrf-files/${customer}/${fileName}`,
        yearMonth: fileName.replace(".json", ""),
        sizeBytes: fileStat.size,
        lastModified: fileStat.mtime.toISOString(),
      });
    }
  }

  // Sort by customer then by yearMonth descending (newest first)
  return result.sort((a, b) =>
    a.customer !== b.customer
      ? a.customer.localeCompare(b.customer)
      : b.yearMonth.localeCompare(a.yearMonth)
  );
}

export default mrfRoutes;
