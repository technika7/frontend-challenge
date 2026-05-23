/**
 * @file mrfService.ts
 * @description API service layer for all backend interactions.
 *
 * All HTTP calls are centralized here so that:
 * - The base URL is configured in one place
 * - Error handling follows a consistent pattern
 * - Components and stores don't import fetch directly
 */

import type {
  MrfGenerationPayload,
  MrfGenerationResponse,
  MrfFilesListResponse,
  CustomerMrfFilesResponse,
} from "../utils/mrfMapper";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Backend API base URL — reads from Vite env or falls back to localhost */
const API_BASE_URL =
  (import.meta as unknown as { env: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:8080";

// ---------------------------------------------------------------------------
// Generic fetch helper with typed error handling
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T; ok: true } | { error: string; ok: false }> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: json?.error ?? `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { ok: true, data: json as T };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network request failed";
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// MRF Service API methods
// ---------------------------------------------------------------------------

/**
 * Sends approved claims to the backend for MRF JSON file generation.
 *
 * @param payload - Validated claim data from the review page
 * @returns Generation result with file names and count
 */
export async function generateMrfFiles(
  payload: MrfGenerationPayload
): Promise<{ data: MrfGenerationResponse; ok: true } | { error: string; ok: false }> {
  return apiFetch<MrfGenerationResponse>("/api/mrf/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches the complete list of all generated MRF files from the backend.
 *
 * @returns Array of MRF file metadata records
 */
export async function fetchAllMrfFiles(): Promise<
  { data: MrfFilesListResponse; ok: true } | { error: string; ok: false }
> {
  return apiFetch<MrfFilesListResponse>("/api/mrf/files");
}

/**
 * Fetches MRF files for a specific customer group.
 *
 * @param customerId - The group ID (e.g., "ACM001") to filter by
 * @returns Array of MRF file metadata for that customer
 */
export async function fetchCustomerMrfFiles(customerId: string): Promise<
  | { data: CustomerMrfFilesResponse; ok: true }
  | { error: string; ok: false }
> {
  return apiFetch<CustomerMrfFilesResponse>(`/api/mrf/files/${encodeURIComponent(customerId)}`);
}

/**
 * Returns the full download URL for a given MRF file path.
 * Used on the public MRF listing page to generate direct download links.
 *
 * @param filePath - Relative URL path like "/mrf-files/ACM001/2024-10.json"
 */
export function getMrfDownloadUrl(filePath: string): string {
  return `${API_BASE_URL}${filePath}`;
}
