/**
 * @file csvValidator.ts
 * @description Zod schema for validating parsed CSV claim rows on the frontend.
 *
 * This schema mirrors the columns in data/sample.csv and provides:
 *  - Type coercion (all CSV values start as strings)
 *  - Domain validation (enums, positive numbers, date formats)
 *  - Descriptive error messages per field
 *
 * The same schema shape is used server-side (backend/src/schemas/claim.schema.ts)
 * to provide a second validation layer before MRF generation.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enum definitions matching the allowed values in the sample data
// ---------------------------------------------------------------------------

export const PLACE_OF_SERVICE_VALUES = [
  "Inpatient Hospital",
  "Outpatient Hospital",
  "Emergency Room - Hospital",
  "Office",
  "Telehealth",
  "Urgent Care",
  "Other",
] as const;

export const CLAIM_TYPE_VALUES = ["Professional", "Institutional"] as const;

export const CLAIM_STATUS_VALUES = [
  "Payable",
  "Denied",
  "Partial Deny",
] as const;

export const PlaceOfServiceEnum = z.enum(PLACE_OF_SERVICE_VALUES);
export const ClaimTypeEnum = z.enum(CLAIM_TYPE_VALUES);
export const ClaimStatusEnum = z.enum(CLAIM_STATUS_VALUES);

// ---------------------------------------------------------------------------
// Core claim row schema — validates a single row parsed from the CSV
// ---------------------------------------------------------------------------

export const ClaimRowSchema = z.object({
  /** Unique claim identifier */
  claimId: z.string().min(1, "Claim ID is required").trim(),

  /** Subscriber / member ID */
  subscriberId: z.string().min(1, "Subscriber ID is required").trim(),

  /** Member sequence number within the subscriber family */
  memberSequence: z.coerce
    .number()
    .int()
    .nonnegative("Member sequence must be non-negative"),

  /** Current processing status */
  claimStatus: ClaimStatusEnum,

  /** Total amount billed by the provider (USD) */
  billed: z.coerce
    .number()
    .positive("Billed amount must be greater than 0"),

  /** Allowed amount determined by the insurer (USD) */
  allowed: z.coerce
    .number()
    .nonnegative("Allowed amount must be non-negative"),

  /** Actual payment made to the provider (USD) */
  paid: z.coerce
    .number()
    .nonnegative("Paid amount must be non-negative"),

  /** ISO date: when payment status was last updated */
  paymentStatusDate: z.string().min(1, "Payment status date is required"),

  /** ISO date: date the medical service was rendered */
  serviceDate: z.string().min(1, "Service date is required"),

  /** ISO date: date the claim was received by the insurer */
  receivedDate: z.string().min(1, "Received date is required"),

  /** ISO date: date the claim entered the processing system */
  entryDate: z.string().min(1, "Entry date is required"),

  /** ISO date: date the claim was fully processed */
  processedDate: z.string().min(1, "Processed date is required"),

  /** ISO date: date the payment was disbursed */
  paidDate: z.string().min(1, "Paid date is required"),

  /** Human-readable payment status (e.g., "Paid") */
  paymentStatus: z.string().min(1, "Payment status is required"),

  /** Employer group / plan sponsor name */
  groupName: z.string().min(1, "Group name is required").trim(),

  /** Employer group identifier — used to organize MRF output by customer */
  groupId: z.string().min(1, "Group ID is required").trim(),

  /** Division name within the employer group */
  divisionName: z.string().trim(),

  /** Division code identifier */
  divisionId: z.string().trim(),

  /** Health plan product name */
  plan: z.string().min(1, "Plan is required").trim(),

  /** Health plan product identifier */
  planId: z.string().min(1, "Plan ID is required").trim(),

  /** Where the medical service was performed */
  placeOfService: PlaceOfServiceEnum,

  /** Professional (physician/outpatient) or Institutional (hospital/facility) */
  claimType: ClaimTypeEnum,

  /** CPT, HCPCS, or DRG procedure code */
  procedureCode: z.string().min(1, "Procedure code is required").trim(),

  /** Member's biological sex */
  memberGender: z.string().optional(),

  /** Provider NPI or internal identifier */
  providerId: z.string().min(1, "Provider ID is required").trim(),

  /** Full name of the rendering provider */
  providerName: z.string().min(1, "Provider name is required").trim(),
});

/** TypeScript type inferred from the Zod schema */
export type ClaimRow = z.infer<typeof ClaimRowSchema>;

// ---------------------------------------------------------------------------
// CSV column header → schema field name mapping
// ---------------------------------------------------------------------------

/**
 * Maps raw CSV column headers (exactly as they appear in sample.csv) to the
 * camelCase field names in ClaimRowSchema. Papaparse gives us the header
 * names; we use this map to build objects that Zod can validate.
 */
export const CSV_HEADER_MAP: Record<string, keyof ClaimRow> = {
  "Claim ID": "claimId",
  "Subscriber ID": "subscriberId",
  "Member Sequence": "memberSequence",
  "Claim Status": "claimStatus",
  Billed: "billed",
  Allowed: "allowed",
  Paid: "paid",
  "Payment Status Date": "paymentStatusDate",
  "Service Date": "serviceDate",
  "Received Date": "receivedDate",
  "Entry Date": "entryDate",
  "Processed Date": "processedDate",
  "Paid Date": "paidDate",
  "Payment Status": "paymentStatus",
  "Group Name": "groupName",
  "Group ID": "groupId",
  "Division Name": "divisionName",
  "Division ID": "divisionId",
  Plan: "plan",
  "Plan ID": "planId",
  "Place of Service": "placeOfService",
  "Claim Type": "claimType",
  "Procedure Code": "procedureCode",
  "Member Gender": "memberGender",
  "Provider ID": "providerId",
  "Provider Name": "providerName",
};

// ---------------------------------------------------------------------------
// Validation result types
// ---------------------------------------------------------------------------

export interface ClaimValidationError {
  /** Row index in the original CSV (0-based, not counting the header) */
  rowIndex: number;
  /** The Claim ID if parseable, otherwise undefined */
  claimId?: string;
  /** Zod field-level errors for this row */
  fieldErrors: Record<string, string[]>;
}

export interface ValidationResult {
  validRows: ClaimRow[];
  errors: ClaimValidationError[];
}

// ---------------------------------------------------------------------------
// Batch validation function
// ---------------------------------------------------------------------------

/**
 * Validates an array of raw objects (parsed from CSV) against ClaimRowSchema.
 *
 * @param rawRows - Array of objects keyed by CSV column headers (after header mapping)
 * @returns A ValidationResult with separated valid rows and structured errors
 */
export function validateClaimRows(
  rawRows: Record<string, string>[]
): ValidationResult {
  const validRows: ClaimRow[] = [];
  const errors: ClaimValidationError[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];

    // Remap CSV headers to camelCase field names
    const mapped: Record<string, unknown> = {};
    for (const [csvHeader, fieldName] of Object.entries(CSV_HEADER_MAP)) {
      mapped[fieldName] = rawRow[csvHeader] ?? rawRow[fieldName] ?? "";
    }

    const result = ClaimRowSchema.safeParse(mapped);

    if (result.success) {
      validRows.push(result.data);
    } else {
      errors.push({
        rowIndex: i,
        claimId: mapped.claimId as string | undefined,
        fieldErrors: result.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      });
    }
  }

  return { validRows, errors };
}
