import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import Papa from "papaparse";
import type { ClaimRow } from "../../utils/csvValidator";

describe("appStore - Core Application State", () => {
  let appStore: any;

  beforeAll(async () => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    globalThis.localStorage = localStorageMock as unknown as Storage;

    const module = await import("../appStore");
    appStore = module.appStore;
  });
  beforeEach(() => {
    appStore.authStore.logout();
    appStore.claimsStore.reset();
    appStore.uploadStore.reset();
  });

  describe("AuthStore", () => {
    it("should start unauthenticated", () => {
      expect(appStore.authStore.isAuthenticated).toBe(false);
      expect(appStore.authStore.username).toBeNull();
    });

    it("should successfully login with demo credentials", async () => {
      const success = await appStore.authStore.login("admin", "password123");
      expect(success).toBe(true);
      expect(appStore.authStore.isAuthenticated).toBe(true);
      expect(appStore.authStore.username).toBe("admin");
    });

    it("should fail login with invalid credentials", async () => {
      const success = await appStore.authStore.login("wrong", "credentials");
      expect(success).toBe(false);
      expect(appStore.authStore.isAuthenticated).toBe(false);
      expect(appStore.authStore.loginError).toBe("Invalid username or password");
    });
  });

  describe("ClaimsStore", () => {
    const mockValidClaims: ClaimRow[] = [
      {
        claimId: "C1",
        subscriberId: "S1",
        memberSequence: 1,
        claimStatus: "Payable",
        billed: 100,
        allowed: 80,
        paid: 80,
        paymentStatusDate: "2024-10-15",
        serviceDate: "2024-10-10",
        receivedDate: "2024-10-11",
        entryDate: "2024-10-11",
        processedDate: "2024-10-12",
        paidDate: "2024-10-15",
        paymentStatus: "Paid",
        groupName: "Test Group",
        groupId: "GRP1",
        divisionName: "Div A",
        divisionId: "D1",
        plan: "PPO",
        planId: "P1",
        placeOfService: "Other",
        claimType: "Professional",
        procedureCode: "99213",
        memberGender: "M",
        providerId: "PRV1",
        providerName: "Dr. Smith",
      },
      {
        claimId: "C2",
        subscriberId: "S2",
        memberSequence: 1,
        claimStatus: "Payable",
        billed: 200,
        allowed: 150,
        paid: 150,
        paymentStatusDate: "2024-10-16",
        serviceDate: "2024-10-11",
        receivedDate: "2024-10-12",
        entryDate: "2024-10-12",
        processedDate: "2024-10-13",
        paidDate: "2024-10-16",
        paymentStatus: "Paid",
        groupName: "Test Group",
        groupId: "GRP1",
        divisionName: "Div A",
        divisionId: "D1",
        plan: "PPO",
        planId: "P1",
        placeOfService: "Other",
        claimType: "Professional",
        procedureCode: "99214",
        memberGender: "F",
        providerId: "PRV2",
        providerName: "Dr. Jones",
      },
    ];

    it("should load claims and initialize them as unapproved", () => {
      appStore.claimsStore.loadClaims(mockValidClaims);

      expect(appStore.claimsStore.totalCount).toBe(2);
      expect(appStore.claimsStore.approvedCount).toBe(0);
      expect(appStore.claimsStore.pendingClaims.length).toBe(2);

      const firstClaim = appStore.claimsStore.claims[0];
      expect(firstClaim._id).toBe("C1");
      expect(firstClaim._approved).toBe(false);
    });

    it("should toggle claim approval status", () => {
      appStore.claimsStore.loadClaims(mockValidClaims);

      appStore.claimsStore.toggleApprove("C1");
      expect(appStore.claimsStore.approvedCount).toBe(1);
      expect(appStore.claimsStore.approvedClaims[0]._id).toBe("C1");

      appStore.claimsStore.toggleApprove("C1"); // Toggle back
      expect(appStore.claimsStore.approvedCount).toBe(0);
    });

    it("should approve all claims at once", () => {
      appStore.claimsStore.loadClaims(mockValidClaims);

      appStore.claimsStore.approveAll();
      expect(appStore.claimsStore.approvedCount).toBe(2);
    });

    it("should remove a claim", () => {
      appStore.claimsStore.loadClaims(mockValidClaims);

      appStore.claimsStore.removeClaim("C1");
      expect(appStore.claimsStore.totalCount).toBe(1);
      expect(appStore.claimsStore.claims[0]._id).toBe("C2");
    });
  });

  describe("UploadStore", () => {
    it("should initialize with empty state", () => {
      expect(appStore.uploadStore.parseError).toBeNull();
      expect(appStore.uploadStore.validationErrors).toEqual([]);
      expect(appStore.uploadStore.totalRows).toBe(0);
      expect(appStore.uploadStore.validRowCount).toBe(0);
      expect(appStore.uploadStore.errorRowCount).toBe(0);
    });

    it("should properly reset state", () => {
      appStore.uploadStore.parseError = "No valid claims found. Please check the CSV format.";
      appStore.uploadStore.isSuccess = true;
      appStore.uploadStore.rawRows = [{}];

      appStore.uploadStore.reset();

      expect(appStore.uploadStore.parseError).toBeNull();
      expect(appStore.uploadStore.isSuccess).toBe(false);
      expect(appStore.uploadStore.totalRows).toBe(0);
    });

    it("should set parseError when no valid claims are found (invalid format)", async () => {
      // @ts-expect-error - Mocking an overloaded method signature
      const parseSpy = vi.spyOn(Papa, "parse").mockImplementation((_file: any, config: any) => {
        config.complete({
          errors: [],
          data: [{ wrong_column: "invalid" }],
          meta: { fields: ["wrong_column"] },
        });
        return Papa;
      });

      const dummyFile = new File(["dummy"], "test.csv", { type: "text/csv" });

      await appStore.uploadStore.parseAndValidate(dummyFile);

      expect(appStore.uploadStore.parseError).toBe("No valid claims found. Please check the CSV format.");
      expect(appStore.uploadStore.isSuccess).toBe(false);

      parseSpy.mockRestore();
    });

    it("should process a valid file successfully and load claims into ClaimsStore", async () => {
      const validRawRow = {
        "Claim ID": "C999",
        "Subscriber ID": "S999",
        "Member Sequence": "1",
        "Claim Status": "Payable",
        Billed: "500",
        Allowed: "300",
        Paid: "300",
        "Payment Status Date": "2024-10-15",
        "Service Date": "2024-10-10",
        "Received Date": "2024-10-11",
        "Entry Date": "2024-10-11",
        "Processed Date": "2024-10-12",
        "Paid Date": "2024-10-15",
        "Payment Status": "Paid",
        "Group Name": "Test Group",
        "Group ID": "GRP1",
        "Division Name": "Div A",
        "Division ID": "D1",
        Plan: "PPO",
        "Plan ID": "P1",
        "Place of Service": "Office",
        "Claim Type": "Professional",
        "Procedure Code": "99213",
        "Member Gender": "M",
        "Provider ID": "PRV1",
        "Provider Name": "Dr. Smith"
      };

      // @ts-expect-error - Mocking an overloaded method signature
      const parseSpy = vi.spyOn(Papa, "parse").mockImplementation((file: any, config: any) => {
        config.complete({
          errors: [],
          data: [validRawRow],
          meta: { fields: Object.keys(validRawRow) },
        });
        return Papa;
      });

      const dummyFile = new File(["dummy"], "test.csv", { type: "text/csv" });
      await appStore.uploadStore.parseAndValidate(dummyFile);

      expect(appStore.uploadStore.parseError).toBeNull();
      expect(appStore.uploadStore.isSuccess).toBe(true);
      expect(appStore.uploadStore.validRowCount).toBe(1);
      expect(appStore.uploadStore.errorRowCount).toBe(0);

      // Verify that the claims were handed over to the ClaimsStore
      expect(appStore.claimsStore.totalCount).toBe(1);
      expect(appStore.claimsStore.claims[0]._id).toBe("C999");

      parseSpy.mockRestore();
    });
  });
});
