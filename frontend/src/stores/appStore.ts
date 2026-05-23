/**
 * @file appStore.ts
 * @description Single MobX store for ALL application state.
 *
 * Per the challenge requirements, all state management is confined to this one file.
 * The store is organized into logical sections:
 *
 *   1. Auth State      — dummy authentication (login / logout)
 *   2. Upload State    — file upload, CSV parsing, validation
 *   3. Claims State    — editable claim rows, approval management
 *   4. MRF State       — API interaction, generated file listing
 *
 * Usage:
 *   import { appStore } from "@/stores/appStore";
 *   const { authStore, uploadStore, claimsStore, mrfStore } = appStore;
 *
 * In components, wrap with `observer()` from mobx-react-lite to enable
 * automatic re-rendering when observable state changes.
 */

import { makeAutoObservable, runInAction } from "mobx";
import Papa from "papaparse";
import { validateClaimRows, type ClaimRow, type ClaimValidationError } from "../utils/csvValidator";
import { buildMrfPayload } from "../utils/mrfMapper";
import {
  generateMrfFiles,
  fetchAllMrfFiles,
  fetchCustomerMrfFiles,
} from "../services/mrfService";
import type { MrfFileMeta, MrfGenerationResponse } from "../utils/mrfMapper";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Dummy credentials for the mock authentication system */
const DUMMY_CREDENTIALS = {
  username: "admin",
  password: "password123",
} as const;

/** LocalStorage key for persisting auth state across page refreshes */
const AUTH_STORAGE_KEY = "mrf_auth_user";

// ---------------------------------------------------------------------------
// Auth Store
// ---------------------------------------------------------------------------

class AuthStore {
  /** Whether the current user is authenticated */
  isAuthenticated = false;

  /** The currently logged-in user's username */
  username: string | null = null;

  /** Login form error message (null when no error) */
  loginError: string | null = null;

  /** Whether the login request is in flight */
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
    this.rehydrate();
  }

  /** Restore auth state from localStorage on app init */
  private rehydrate() {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const { username } = JSON.parse(stored) as { username: string };
        this.isAuthenticated = true;
        this.username = username;
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }

  /**
   * Performs dummy authentication.
   * In a real app this would call an auth API; here we compare against constants.
   */
  async login(username: string, password: string): Promise<boolean> {
    this.isLoading = true;
    this.loginError = null;

    // Simulate network latency for realism
    await new Promise((resolve) => setTimeout(resolve, 600));

    runInAction(() => {
      if (
        username === DUMMY_CREDENTIALS.username &&
        password === DUMMY_CREDENTIALS.password
      ) {
        this.isAuthenticated = true;
        this.username = username;
        this.loginError = null;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username }));
      } else {
        this.isAuthenticated = false;
        this.loginError = "Invalid username or password";
      }
      this.isLoading = false;
    });

    return this.isAuthenticated;
  }

  /** Clears auth state and removes persisted session */
  logout() {
    this.isAuthenticated = false;
    this.username = null;
    this.loginError = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

// ---------------------------------------------------------------------------
// Upload Store
// ---------------------------------------------------------------------------

/** A raw parsed row from Papaparse (all values as strings) */
type RawRow = Record<string, string>;

class UploadStore {
  /** The currently selected File object */
  file: File | null = null;

  /** Papaparse-parsed raw row objects before validation */
  rawRows: RawRow[] = [];

  /** The headers found in the parsed CSV file */
  foundHeaders: string[] = [];

  /** Zod validation errors from the last parse attempt */
  validationErrors: ClaimValidationError[] = [];

  /** Whether CSV parsing + validation is in progress */
  isLoading = false;

  /** High-level parse error (e.g., wrong file format) */
  parseError: string | null = null;

  /** Whether the upload + validation completed successfully */
  isSuccess = false;

  constructor() {
    makeAutoObservable(this);
  }

  /** Resets all upload state (e.g., when user selects a new file) */
  reset() {
    this.file = null;
    this.rawRows = [];
    this.foundHeaders = [];
    this.validationErrors = [];
    this.isLoading = false;
    this.parseError = null;
    this.isSuccess = false;
  }

  /**
   * Parses a CSV File using Papaparse and validates every row with Zod.
   * On success, populates claimsStore with the validated rows.
   * On failure, exposes structured per-row error messages.
   *
   * @param file - The File object selected by the user
   */
  async parseAndValidate(file: File): Promise<void> {
    this.isLoading = true;
    this.parseError = null;
    this.validationErrors = [];
    this.isSuccess = false;
    this.file = file;

    return new Promise<void>((resolve) => {
      Papa.parse<RawRow>(file, {
        header: true,          // Use the first row as field names
        skipEmptyLines: true,  // Ignore blank rows
        dynamicTyping: false,  // Keep everything as strings; Zod handles coercion
        complete: (results) => {
          runInAction(() => {
            if (results.errors.length > 0) {
              // Papaparse-level errors (malformed CSV structure)
              this.parseError = `CSV parse error: ${results.errors[0].message}`;
              this.isLoading = false;
              resolve();
              return;
            }

            const rawRows = results.data;
            this.rawRows = rawRows;
            this.foundHeaders = results.meta.fields || [];

            // Validate all rows against the Zod schema
            const { validRows, errors } = validateClaimRows(rawRows);
            this.validationErrors = errors;

            if (validRows.length === 0 && errors.length > 0) {
              // No valid rows at all
              this.parseError = "No valid claims found. Please check the CSV format.";
            } else {
              // Populate the claims store with all valid rows
              appStore.claimsStore.loadClaims(validRows);
              this.isSuccess = true;
            }

            this.isLoading = false;
            resolve();
          });
        },
        error: (error) => {
          runInAction(() => {
            this.parseError = `Failed to read file: ${error.message}`;
            this.isLoading = false;
            resolve();
          });
        },
      });
    });
  }

  /** Total number of parsed rows (valid + invalid) */
  get totalRows(): number {
    return this.rawRows.length;
  }

  /** Number of rows that passed validation */
  get validRowCount(): number {
    return this.totalRows - this.validationErrors.length;
  }

  /** Number of rows that failed validation */
  get errorRowCount(): number {
    return this.validationErrors.length;
  }
}

// ---------------------------------------------------------------------------
// Claims Store
// ---------------------------------------------------------------------------

/** An editable claim row augmented with UI state */
export interface EditableClaim extends ClaimRow {
  /** Unique UI identifier (set from claimId) */
  _id: string;
  /** Whether this claim has been approved by the user */
  _approved: boolean;
}

class ClaimsStore {
  /** All claims loaded from the CSV (valid rows only) */
  claims: EditableClaim[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Loads validated claim rows into the store, resetting any previous data.
   * Called by UploadStore after successful parse + validation.
   */
  loadClaims(validRows: ClaimRow[]) {
    this.claims = validRows.map((row) => ({
      ...row,
      _id: row.claimId,
      _approved: false, // All claims start as unapproved
    }));
  }

  /** Resets all claim data (e.g., when starting a new upload) */
  reset() {
    this.claims = [];
  }

  /**
   * Updates a single field on a specific claim.
   * Called by AG Grid's cell value changed callback.
   *
   * @param claimId - The _id of the claim to update
   * @param field - The field name to update
   * @param value - The new value
   */
  updateClaimField(claimId: string, field: keyof ClaimRow, value: unknown) {
    const claim = this.claims.find((c) => c._id === claimId);
    if (claim) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (claim as any)[field] = value;
    }
  }

  /**
   * Removes a claim from the list.
   * @param claimId - The _id of the claim to remove
   */
  removeClaim(claimId: string) {
    this.claims = this.claims.filter((c) => c._id !== claimId);
  }

  /**
   * Toggles the approval state of a single claim.
   * @param claimId - The _id of the claim to toggle
   */
  toggleApprove(claimId: string) {
    const claim = this.claims.find((c) => c._id === claimId);
    if (claim) {
      claim._approved = !claim._approved;
    }
  }

  /** Approves all claims in the list */
  approveAll() {
    this.claims.forEach((c) => (c._approved = true));
  }

  /** Rejects (un-approves) all claims in the list */
  rejectAll() {
    this.claims.forEach((c) => (c._approved = false));
  }

  /** Returns only the claims marked as approved */
  get approvedClaims(): EditableClaim[] {
    return this.claims.filter((c) => c._approved);
  }

  /** Returns only the unapproved claims */
  get pendingClaims(): EditableClaim[] {
    return this.claims.filter((c) => !c._approved);
  }

  /** Total number of claims in the store */
  get totalCount(): number {
    return this.claims.length;
  }

  /** Number of approved claims */
  get approvedCount(): number {
    return this.approvedClaims.length;
  }
}

// ---------------------------------------------------------------------------
// MRF Store
// ---------------------------------------------------------------------------

class MrfStore {
  /** Whether the MRF generation API call is in flight */
  isGenerating = false;

  /** Result from the last successful generation call */
  generationResult: MrfGenerationResponse | null = null;

  /** Error message from the last failed generation call */
  generationError: string | null = null;

  /** All MRF files listed from the API */
  allFiles: MrfFileMeta[] = [];

  /** MRF files for the currently selected customer */
  customerFiles: MrfFileMeta[] = [];

  /** The currently selected customer ID */
  selectedCustomer: string | null = null;

  /** Whether file list fetching is in progress */
  isFetchingFiles = false;

  /** Error from listing files */
  fetchError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Submits approved claims to the backend for MRF generation.
   * Reads approved claims from claimsStore automatically.
   */
  async generateMrf(): Promise<void> {
    const approvedClaims = appStore.claimsStore.approvedClaims;

    if (approvedClaims.length === 0) {
      this.generationError = "No approved claims to generate MRF files from.";
      return;
    }

    this.isGenerating = true;
    this.generationError = null;
    this.generationResult = null;

    const payload = buildMrfPayload(approvedClaims);
    const result = await generateMrfFiles(payload);

    runInAction(() => {
      if (result.ok) {
        this.generationResult = result.data;
        // Refresh file list after successful generation
        this.fetchAllFiles();
      } else {
        // TypeScript discriminated union — access .error only on the failure branch
        const err = result as { error: string; ok: false };
        this.generationError = err.error;
      }
      this.isGenerating = false;
    });
  }

  /** Fetches the full list of MRF files from the backend */
  async fetchAllFiles(): Promise<void> {
    this.isFetchingFiles = true;
    this.fetchError = null;

    const result = await fetchAllMrfFiles();

    runInAction(() => {
      if (result.ok) {
        this.allFiles = result.data.files;
      } else {
        const err = result as { error: string; ok: false };
        this.fetchError = err.error;
      }
      this.isFetchingFiles = false;
    });
  }

  /**
   * Fetches MRF files for a specific customer group.
   * @param customerId - The group ID to filter by (e.g., "ACM001")
   */
  async fetchCustomerFiles(customerId: string): Promise<void> {
    this.isFetchingFiles = true;
    this.fetchError = null;
    this.selectedCustomer = customerId;

    const result = await fetchCustomerMrfFiles(customerId);

    runInAction(() => {
      if (result.ok) {
        this.customerFiles = result.data.files;
      } else {
        const err = result as { error: string; ok: false };
        this.fetchError = err.error;
      }
      this.isFetchingFiles = false;
    });
  }

  /** Returns all unique customer IDs from the file list */
  get uniqueCustomers(): string[] {
    return [...new Set(this.allFiles.map((f) => f.customer))].sort();
  }
}

// ---------------------------------------------------------------------------
// Root App Store — single object containing all sub-stores
// ---------------------------------------------------------------------------

class AppStore {
  authStore: AuthStore;
  uploadStore: UploadStore;
  claimsStore: ClaimsStore;
  mrfStore: MrfStore;

  constructor() {
    this.authStore = new AuthStore();
    this.uploadStore = new UploadStore();
    this.claimsStore = new ClaimsStore();
    this.mrfStore = new MrfStore();
  }
}

/** Singleton store instance — import and use directly in components */
export const appStore = new AppStore();

// Re-export individual stores for convenience
export const { authStore, uploadStore, claimsStore, mrfStore } = appStore;
