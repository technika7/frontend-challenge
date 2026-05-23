/**
 * @file mrfMapper.ts
 * @description Maps validated frontend ClaimRow objects into the API request
 * payload expected by the backend's MRF generation endpoint.
 *
 * This intentionally keeps the frontend schema and backend schema decoupled —
 * changes to one do not automatically break the other.
 */

import type { ClaimRow } from "./csvValidator";

// ---------------------------------------------------------------------------
// API Request Payload Types
// ---------------------------------------------------------------------------

/**
 * Single claim payload sent to POST /api/mrf/generate.
 * Field names match the backend ClaimSchema exactly.
 */
export interface ApiClaim {
  claimId: string;
  subscriberId: string;
  memberSequence: number;
  claimStatus: string;
  billed: number;
  allowed: number;
  paid: number;
  paymentStatusDate: string;
  serviceDate: string;
  receivedDate: string;
  entryDate: string;
  processedDate: string;
  paidDate: string;
  paymentStatus: string;
  groupName: string;
  groupId: string;
  divisionName: string;
  divisionId: string;
  plan: string;
  planId: string;
  placeOfService: string;
  claimType: string;
  procedureCode: string;
  memberGender?: string;
  providerId: string;
  providerName: string;
}

/** Root MRF generation request body */
export interface MrfGenerationPayload {
  claims: ApiClaim[];
}

/** Response from POST /api/mrf/generate */
export interface MrfGenerationResponse {
  success: boolean;
  message: string;
  files: string[];
  claimsProcessed: number;
}

/** Single MRF file metadata returned by GET /api/mrf/files */
export interface MrfFileMeta {
  customer: string;
  fileName: string;
  url: string;
  yearMonth: string;
  sizeBytes: number;
  lastModified: string;
}

/** Response from GET /api/mrf/files */
export interface MrfFilesListResponse {
  success: boolean;
  files: MrfFileMeta[];
}

/** Response from GET /api/mrf/files/:customer */
export interface CustomerMrfFilesResponse {
  success: boolean;
  customer: string;
  files: MrfFileMeta[];
}

// ---------------------------------------------------------------------------
// Mapping function
// ---------------------------------------------------------------------------

/**
 * Converts a validated ClaimRow into the ApiClaim payload shape.
 * The conversion is straightforward since the schemas are aligned,
 * but this layer lets us add transformations without breaking either side.
 *
 * @param claim - A validated ClaimRow from the frontend schema
 * @returns ApiClaim ready to be included in the generation request body
 */
export function mapClaimToApiPayload(claim: ClaimRow): ApiClaim {
  return {
    claimId: claim.claimId,
    subscriberId: claim.subscriberId,
    memberSequence: claim.memberSequence,
    claimStatus: claim.claimStatus,
    billed: claim.billed,
    allowed: claim.allowed,
    paid: claim.paid,
    paymentStatusDate: claim.paymentStatusDate,
    serviceDate: claim.serviceDate,
    receivedDate: claim.receivedDate,
    entryDate: claim.entryDate,
    processedDate: claim.processedDate,
    paidDate: claim.paidDate,
    paymentStatus: claim.paymentStatus,
    groupName: claim.groupName,
    groupId: claim.groupId,
    divisionName: claim.divisionName ?? "",
    divisionId: claim.divisionId ?? "",
    plan: claim.plan,
    planId: claim.planId,
    placeOfService: claim.placeOfService,
    claimType: claim.claimType,
    procedureCode: claim.procedureCode,
    memberGender: claim.memberGender,
    providerId: claim.providerId,
    providerName: claim.providerName,
  };
}

/**
 * Builds the full generation request payload from an array of approved claims.
 *
 * @param approvedClaims - Claims the user has approved in the review table
 * @returns The request body for POST /api/mrf/generate
 */
export function buildMrfPayload(
  approvedClaims: ClaimRow[]
): MrfGenerationPayload {
  return {
    claims: approvedClaims.map(mapClaimToApiPayload),
  };
}
