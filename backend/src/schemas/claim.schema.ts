/**
 * @file claim.schema.ts
 * @description Zod schema for validating incoming claim payloads from the frontend.
 * Each claim row has been pre-validated on the frontend; this provides a
 * server-side double-validation layer before MRF generation.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Allowed enum values matching the CMS TiC specification
// ---------------------------------------------------------------------------

export const PlaceOfServiceEnum = z.enum([
  "Inpatient Hospital",
  "Outpatient Hospital",
  "Emergency Room - Hospital",
  "Office",
  "Telehealth",
  "Urgent Care",
  "Other",
]);

export const ClaimTypeEnum = z.enum(["Professional", "Institutional"]);

export const ClaimStatusEnum = z.enum(["Payable", "Denied", "Partial Deny"]);

// ---------------------------------------------------------------------------
// Single claim schema — mirrors the CSV columns from data/sample.csv
// ---------------------------------------------------------------------------

export const ClaimSchema = z.object({
  /** Unique identifier for this claim */
  claimId: z.string().min(1, "Claim ID is required"),

  /** Health plan subscriber identifier */
  subscriberId: z.string().min(1, "Subscriber ID is required"),

  /** Member sequence number within the subscriber */
  memberSequence: z.coerce.number().int().nonnegative(),

  /** Processing status of the claim */
  claimStatus: ClaimStatusEnum,

  /** Total amount billed by the provider (USD) */
  billed: z.coerce.number().positive("Billed amount must be positive"),

  /** Allowed amount negotiated / determined by the insurer (USD) */
  allowed: z.coerce.number().nonnegative("Allowed amount must be non-negative"),

  /** Actual amount paid to the provider (USD) */
  paid: z.coerce.number().nonnegative("Paid amount must be non-negative"),

  /** Date the payment status was last updated */
  paymentStatusDate: z.string().min(1),

  /** Date the service was rendered (ISO 8601 date string) */
  serviceDate: z.string().min(1, "Service date is required"),

  /** Date the claim was received by the insurer */
  receivedDate: z.string().min(1),

  /** Date the claim was entered into the system */
  entryDate: z.string().min(1),

  /** Date the claim was processed */
  processedDate: z.string().min(1),

  /** Date the payment was made */
  paidDate: z.string().min(1),

  /** Human-readable payment status label */
  paymentStatus: z.string().min(1),

  /** Employer group / plan sponsor name */
  groupName: z.string().min(1, "Group name is required"),

  /** Employer group identifier used to organize MRF output files */
  groupId: z.string().min(1, "Group ID is required"),

  /** Sub-division of the employer group */
  divisionName: z.string(),

  /** Division identifier code */
  divisionId: z.string(),

  /** Health plan product name */
  plan: z.string().min(1),

  /** Health plan product identifier */
  planId: z.string().min(1),

  /** Where the service was performed */
  placeOfService: PlaceOfServiceEnum,

  /** Whether this is a professional or institutional claim */
  claimType: ClaimTypeEnum,

  /** CPT / HCPCS / DRG procedure code */
  procedureCode: z.string().min(1, "Procedure code is required"),

  /** Member biological sex */
  memberGender: z.string().optional(),

  /** NPI or internal provider identifier */
  providerId: z.string().min(1, "Provider ID is required"),

  /** Full name of the rendering provider */
  providerName: z.string().min(1, "Provider name is required"),
});

/** TypeScript type inferred from the Zod schema */
export type Claim = z.infer<typeof ClaimSchema>;

// ---------------------------------------------------------------------------
// MRF generation request payload — array of approved claims
// ---------------------------------------------------------------------------

export const MrfGenerationRequestSchema = z.object({
  /** The list of approved claims to be aggregated into MRF output */
  claims: z.array(ClaimSchema).min(1, "At least one claim is required"),
});

export type MrfGenerationRequest = z.infer<typeof MrfGenerationRequestSchema>;
