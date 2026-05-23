import { describe, it, expect } from "vitest";
import { MrfGeneratorContext } from "../mrf-generator";
import { ProfessionalClaimsStrategy } from "../mrf-generator";
import { InstitutionalClaimsStrategy } from "../mrf-generator";
import type { ClaimPayload } from "../../schemas/claim.schema";

describe("MRF Generator Strategy Pattern", () => {
  const mockClaim: ClaimPayload = {
    claimId: "C1",
    subscriberId: "S1",
    memberSequence: 1,
    claimStatus: "Payable",
    billed: 500,
    allowed: 300,
    paid: 300,
    paymentStatusDate: "2024-10-15",
    serviceDate: "2024-10-10",
    receivedDate: "2024-10-11",
    entryDate: "2024-10-11",
    processedDate: "2024-10-12",
    paidDate: "2024-10-15",
    paymentStatus: "Paid",
    groupName: "Test Group",
    groupId: "GRP001",
    divisionName: "Div A",
    divisionId: "D1",
    plan: "PPO",
    planId: "P1",
    placeOfService: "11", // Office
    claimType: "Professional",
    procedureCode: "99213",
    memberGender: "M",
    providerId: "PRV1",
    providerName: "Dr. Smith",
  };

  it("should aggregate professional claims correctly", () => {
    const context = new MrfGeneratorContext();

    const claims = [
      mockClaim,
      { ...mockClaim, claimId: "C2", allowed: 400 },
      { ...mockClaim, claimId: "C3", allowed: 500 }
    ];

    const resultsMap = context.generate(claims);
    const results = Array.from(resultsMap.values());

    expect(results.length).toBe(1);
    const doc = results[0];

    expect(doc.reporting_entity_name).toBe("Test Group");
    expect(doc.plan_id).toBe("GRP001");

    // Check provider references
    expect(doc.provider_references).toHaveLength(1);
    expect(doc.provider_references[0].provider_group_id).toBe(0);
    expect(doc.provider_references[0].provider_groups[0].npi[0]).toBe("PRV1");

    // Check in_network items
    expect(doc.in_network).toHaveLength(1);
    const item = doc.in_network[0];
    expect(item.billing_code_type).toBe("CPT");
    expect(item.billing_code).toBe("99213");

    // Check negotiated rates (average of 300, 400, 500 = 400)
    expect(item.negotiated_rates).toHaveLength(1);
    const rate = item.negotiated_rates[0];
    expect(rate.provider_references[0]).toBe(0);
    expect(rate.negotiated_prices[0].negotiated_rate).toBe(400);
    expect(rate.negotiated_prices[0].billing_class).toBe("professional");
  });

  it("should separate different procedure codes into distinct in_network items", () => {
    const context = new MrfGeneratorContext();

    const claims = [
      mockClaim,
      {
        ...mockClaim,
        claimId: "C2",
        procedureCode: "99214", // Different code
        allowed: 450,
      }
    ];

    const resultsMap = context.generate(claims);
    const results = Array.from(resultsMap.values());
    expect(results[0].in_network).toHaveLength(2);

    const codes = results[0].in_network.map((n) => n.billing_code);
    expect(codes).toContain("99213");
    expect(codes).toContain("99214");
  });

  it("should use institutional strategy for institutional claims", () => {
    const context = new MrfGeneratorContext();

    const claims = [{
      ...mockClaim,
      claimType: "Institutional" as const,
      procedureCode: "470", // Must be 3 digits to match DRG regex
    }];

    const resultsMap = context.generate(claims);
    const results = Array.from(resultsMap.values());
    const item = results[0].in_network[0];

    expect(item.billing_code_type).toBe("DRG"); // Institutional mapping
    expect(item.billing_code).toBe("470");
    expect(item.negotiated_rates[0].negotiated_prices[0].billing_class).toBe("institutional");
  });

  it("should group files by reporting month and group ID", () => {
    const context = new MrfGeneratorContext();

    const claims = [
      // Group 1, October
      { ...mockClaim, groupId: "G1", serviceDate: "2024-10-05" },
      // Group 1, November
      { ...mockClaim, groupId: "G1", serviceDate: "2024-11-15" },
      // Group 2, October
      { ...mockClaim, groupId: "G2", serviceDate: "2024-10-20" }
    ];

    const resultsMap = context.generate(claims);
    const fileKeys = Array.from(resultsMap.keys());

    // Should generate 3 separate files
    expect(fileKeys).toHaveLength(3);
    
    expect(fileKeys).toContain("G1/2024-10");
    expect(fileKeys).toContain("G1/2024-11");
    expect(fileKeys).toContain("G2/2024-10");
  });
});
