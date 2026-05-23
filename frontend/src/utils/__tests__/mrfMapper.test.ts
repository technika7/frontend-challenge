import { describe, it, expect } from "vitest";
import { mapClaimToApiPayload, buildMrfPayload } from "../mrfMapper";
import type { ClaimRow } from "../csvValidator";

describe("MRF Mapper", () => {
  const baseRow: ClaimRow = {
    claimId: "C123",
    subscriberId: "S456",
    memberSequence: 1,
    claimStatus: "Payable",
    billed: 500,
    allowed: 300,
    paid: 250,
    paymentStatusDate: "2024-10-15",
    serviceDate: "2024-10-10",
    receivedDate: "2024-10-11",
    entryDate: "2024-10-11",
    processedDate: "2024-10-12",
    paidDate: "2024-10-15",
    paymentStatus: "Paid",
    groupName: "Test Group",
    groupId: "GRP1",
    divisionName: "Div1",
    divisionId: "D1",
    plan: "PPO",
    planId: "P1",
    placeOfService: "Office",
    claimType: "Professional",
    procedureCode: "99213",
    memberGender: "M",
    providerId: "PRV1",
    providerName: "Dr. Smith",
  };

  it("should accurately map a ClaimRow to an ApiClaim payload", () => {
    const payload = mapClaimToApiPayload(baseRow);

    expect(payload.claimId).toBe("C123");
    expect(payload.billed).toBe(500);
    expect(payload.allowed).toBe(300);
    expect(payload.claimStatus).toBe("Payable");
    expect(payload.placeOfService).toBe("Office");
    expect(payload.claimType).toBe("Professional");
    
    expect(Object.keys(payload)).toContain("claimId");
    expect(Object.keys(payload)).toContain("groupName");
    expect(Object.keys(payload)).toContain("procedureCode");
  });

  it("should handle boundary numeric values correctly", () => {
    const edgeRow: ClaimRow = {
      ...baseRow,
      billed: 0,
      allowed: 0,
      paid: 0,
    };

    const payload = mapClaimToApiPayload(edgeRow);
    expect(payload.billed).toBe(0);
    expect(payload.allowed).toBe(0);
  });

  it("should build a complete MRF generation payload", () => {
    const claims = [baseRow, { ...baseRow, claimId: "C999" }];
    const payload = buildMrfPayload(claims);

    expect(payload.claims).toHaveLength(2);
    expect(payload.claims[0].claimId).toBe("C123");
    expect(payload.claims[1].claimId).toBe("C999");
  });
});
