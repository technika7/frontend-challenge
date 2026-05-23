import { describe, it, expect } from "vitest";
import { validateClaimRows } from "../csvValidator";

describe("CSV Validator (Zod)", () => {
  const validRow = {
    "Claim ID": "C123",
    "Subscriber ID": "S456",
    "Member Sequence": "1",
    "Claim Status": "Payable",
    "Billed": "500.00",
    "Allowed": "300.00",
    "Paid": "250.00",
    "Payment Status Date": "2024-10-15",
    "Service Date": "2024-10-10",
    "Received Date": "2024-10-11",
    "Entry Date": "2024-10-11",
    "Processed Date": "2024-10-12",
    "Paid Date": "2024-10-15",
    "Payment Status": "Paid",
    "Group Name": "Test Group",
    "Group ID": "GRP1",
    "Division Name": "Div1",
    "Division ID": "D1",
    "Plan": "PPO",
    "Plan ID": "P1",
    "Place of Service": "Office",
    "Claim Type": "Professional",
    "Procedure Code": "99213",
    "Member Gender": "M",
    "Provider ID": "PRV1",
    "Provider Name": "Dr. Smith",
  };

  it("should validate and coerce a completely valid row", () => {
    const { validRows, errors } = validateClaimRows([validRow]);
    
    if (errors.length > 0) {
      console.log("Validation errors:", JSON.stringify(errors, null, 2));
    }
    
    expect(errors.length).toBe(0);
    expect(validRows.length).toBe(1);

    const parsed = validRows[0];
    
    // Check coercion
    expect(parsed.billed).toBe(500);
    expect(parsed.allowed).toBe(300);
    expect(parsed.memberSequence).toBe(1);
    
    // Check mapping
    expect(parsed.claimId).toBe("C123");
    expect(parsed.providerName).toBe("Dr. Smith");
  });

  it("should catch missing required fields", () => {
    const missingFieldsRow = { ...validRow };
    delete (missingFieldsRow as any)["Claim ID"];
    delete (missingFieldsRow as any)["Billed"];

    const { validRows, errors } = validateClaimRows([missingFieldsRow]);
    
    expect(validRows.length).toBe(0);
    expect(errors.length).toBe(1);
    
    const error = errors[0];
    expect(error.fieldErrors).toHaveProperty("claimId");
    expect(error.fieldErrors).toHaveProperty("billed");
  });

  it("should catch invalid numeric values", () => {
    const invalidNumRow = { ...validRow, "Billed": "Not a number", "Allowed": "-50" };

    const { validRows, errors } = validateClaimRows([invalidNumRow]);
    
    expect(validRows.length).toBe(0);
    expect(errors.length).toBe(1);
    
    const error = errors[0];
    expect(error.fieldErrors.billed[0]).toMatch(/Expected number/i);
    expect(error.fieldErrors.allowed[0]).toMatch(/must be non-negative/i);
  });

  it("should validate enums strictly", () => {
    const invalidEnumRow = { ...validRow, "Claim Status": "PendingReview", "Claim Type": "Dental" };

    const { validRows, errors } = validateClaimRows([invalidEnumRow]);
    
    expect(validRows.length).toBe(0);
    expect(errors.length).toBe(1);

    const error = errors[0];
    expect(error.fieldErrors.claimStatus[0]).toMatch(/Invalid option/i);
    expect(error.fieldErrors.claimType[0]).toMatch(/Invalid option/i);
  });
});
