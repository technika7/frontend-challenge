/**
 * @file mrf-generator.ts
 * @description MRF (Machine-Readable File) generation service using the Strategy design pattern.
 *
 * Pattern Reference: https://refactoring.guru/design-patterns/strategy
 *
 * The CMS Transparency-in-Coverage spec requires separate treatment for
 * "professional" vs "institutional" claim types. Rather than a monolithic
 * function with branching logic, we define a Strategy interface and provide
 * two concrete implementations. A Context class selects and executes the
 * correct strategy at runtime.
 *
 * CMS Schema Reference:
 * https://github.com/CMSgov/price-transparency-guide/tree/master/schemas/allowed-amounts
 */

import type { Claim } from "../schemas/claim.schema.js";

// ---------------------------------------------------------------------------
// CMS Allowed Amounts JSON Schema Types
// ---------------------------------------------------------------------------

/** A single negotiated price entry per billing class */
interface NegotiatedPrice {
  negotiated_type: "allowed";
  negotiated_rate: number;
  expiration_date: string;
  service_code: string[];
  billing_class: "professional" | "institutional";
  billing_code_modifier?: string[];
}

/** Associates a list of providers with their negotiated prices */
interface NegotiatedRate {
  provider_references: number[];
  negotiated_prices: NegotiatedPrice[];
}

/** A single in-network billing code entry */
interface InNetworkItem {
  negotiation_arrangement: "ffs";
  name: string;
  billing_code_type: "CPT" | "HCPCS" | "DRG" | "RC" | "OTHER";
  billing_code_type_version: string;
  billing_code: string;
  description: string;
  negotiated_rates: NegotiatedRate[];
}

/** A provider reference entry used to avoid duplicating provider data */
interface ProviderReference {
  provider_group_id: number;
  provider_groups: Array<{
    npi: string[];
    tin?: { type: "ein" | "npi"; value: string };
  }>;
  location?: string;
}

/** Root CMS allowed-amounts MRF document structure */
export interface MrfDocument {
  reporting_entity_name: string;
  reporting_entity_type: "health insurance issuer";
  plan_name: string;
  plan_id_type: "GROUP";
  plan_id: string;
  plan_market_type: "group";
  last_updated_on: string;
  version: "1.0.0";
  provider_references: ProviderReference[];
  in_network: InNetworkItem[];
}

// ---------------------------------------------------------------------------
// Internal aggregation key type
// ---------------------------------------------------------------------------

/** Composite key used to group claims before computing averages */
interface AggregationKey {
  providerId: string;
  providerName: string;
  procedureCode: string;
  placeOfService: string;
  billingClass: "professional" | "institutional";
}

/** Aggregated data for a group of claims sharing the same composite key */
interface AggregatedGroup {
  key: AggregationKey;
  totalAllowed: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Strategy Interface
// ---------------------------------------------------------------------------

/**
 * Strategy interface for MRF generation.
 * Concrete strategies implement claim-type-specific aggregation logic.
 */
export interface MrfGenerationStrategy {
  /**
   * Generates the `in_network` section of the MRF document.
   * @param claims - Claims filtered to this strategy's billing class
   * @param providerIndexMap - Maps providerId → provider_group_id for references
   */
  buildInNetworkItems(
    claims: Claim[],
    providerIndexMap: Map<string, number>
  ): InNetworkItem[];
}

// ---------------------------------------------------------------------------
// Helper: Determine billing_code_type from a procedure code string
// ---------------------------------------------------------------------------

function inferBillingCodeType(
  procedureCode: string
): "CPT" | "HCPCS" | "DRG" | "RC" | "OTHER" {
  // DRG codes are purely numeric and 3 digits
  if (/^\d{3}$/.test(procedureCode)) return "DRG";
  // HCPCS Level II codes start with a letter
  if (/^[A-Z]\d{4}$/.test(procedureCode)) return "HCPCS";
  // CPT codes are 5 digits (possibly with modifiers)
  if (/^\d{5}$/.test(procedureCode)) return "CPT";
  return "OTHER";
}

// ---------------------------------------------------------------------------
// Shared aggregation helper used by both strategies
// ---------------------------------------------------------------------------

function aggregateClaims(claims: Claim[]): Map<string, AggregatedGroup> {
  const groups = new Map<string, AggregatedGroup>();

  for (const claim of claims) {
    const billingClass =
      claim.claimType === "Professional" ? "professional" : "institutional";

    const key = `${claim.providerId}|${claim.procedureCode}|${claim.placeOfService}|${billingClass}`;

    const existing = groups.get(key);
    if (existing) {
      existing.totalAllowed += claim.allowed;
      existing.count += 1;
    } else {
      groups.set(key, {
        key: {
          providerId: claim.providerId,
          providerName: claim.providerName,
          procedureCode: claim.procedureCode,
          placeOfService: claim.placeOfService,
          billingClass,
        },
        totalAllowed: claim.allowed,
        count: 1,
      });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Concrete Strategy A: Professional Claims
// ---------------------------------------------------------------------------

/**
 * Handles professional claims (physician services, outpatient procedures).
 * Professional claims use CPT/HCPCS codes and service_code arrays.
 */
export class ProfessionalClaimsStrategy implements MrfGenerationStrategy {
  buildInNetworkItems(
    claims: Claim[],
    providerIndexMap: Map<string, number>
  ): InNetworkItem[] {
    // Only handle Professional claim types
    const professionalClaims = claims.filter(
      (c) => c.claimType === "Professional"
    );
    const aggregated = aggregateClaims(professionalClaims);

    // Group aggregated data by procedure code to build one InNetworkItem per code
    const byProcedure = new Map<string, AggregatedGroup[]>();
    for (const group of aggregated.values()) {
      const existing = byProcedure.get(group.key.procedureCode) ?? [];
      existing.push(group);
      byProcedure.set(group.key.procedureCode, existing);
    }

    const items: InNetworkItem[] = [];
    for (const [procedureCode, groups] of byProcedure) {
      const negotiatedRates: NegotiatedRate[] = groups.map((group) => {
        const averageAllowed = +(group.totalAllowed / group.count).toFixed(2);
        const providerRef = providerIndexMap.get(group.key.providerId) ?? 0;

        return {
          provider_references: [providerRef],
          negotiated_prices: [
            {
              negotiated_type: "allowed",
              negotiated_rate: averageAllowed,
              expiration_date: "9999-12-31",
              // Map place-of-service string to a CMS service code
              service_code: [mapPlaceOfServiceToCode(group.key.placeOfService)],
              billing_class: "professional",
            },
          ],
        };
      });

      items.push({
        negotiation_arrangement: "ffs",
        name: `Professional Service - ${procedureCode}`,
        billing_code_type: inferBillingCodeType(procedureCode),
        billing_code_type_version: "2024",
        billing_code: procedureCode,
        description: `Professional claim procedure code ${procedureCode}`,
        negotiated_rates: negotiatedRates,
      });
    }

    return items;
  }
}

// ---------------------------------------------------------------------------
// Concrete Strategy B: Institutional Claims
// ---------------------------------------------------------------------------

/**
 * Handles institutional claims (hospital inpatient/outpatient/ER services).
 * Institutional claims commonly use DRG or revenue codes.
 */
export class InstitutionalClaimsStrategy implements MrfGenerationStrategy {
  buildInNetworkItems(
    claims: Claim[],
    providerIndexMap: Map<string, number>
  ): InNetworkItem[] {
    // Only handle Institutional claim types
    const institutionalClaims = claims.filter(
      (c) => c.claimType === "Institutional"
    );
    const aggregated = aggregateClaims(institutionalClaims);

    const byProcedure = new Map<string, AggregatedGroup[]>();
    for (const group of aggregated.values()) {
      const existing = byProcedure.get(group.key.procedureCode) ?? [];
      existing.push(group);
      byProcedure.set(group.key.procedureCode, existing);
    }

    const items: InNetworkItem[] = [];
    for (const [procedureCode, groups] of byProcedure) {
      const negotiatedRates: NegotiatedRate[] = groups.map((group) => {
        const averageAllowed = +(group.totalAllowed / group.count).toFixed(2);
        const providerRef = providerIndexMap.get(group.key.providerId) ?? 0;

        return {
          provider_references: [providerRef],
          negotiated_prices: [
            {
              negotiated_type: "allowed",
              negotiated_rate: averageAllowed,
              expiration_date: "9999-12-31",
              service_code: [mapPlaceOfServiceToCode(group.key.placeOfService)],
              billing_class: "institutional",
            },
          ],
        };
      });

      items.push({
        negotiation_arrangement: "ffs",
        name: `Institutional Service - ${procedureCode}`,
        billing_code_type: inferBillingCodeType(procedureCode),
        billing_code_type_version: "2024",
        billing_code: procedureCode,
        description: `Institutional claim procedure code ${procedureCode}`,
        negotiated_rates: negotiatedRates,
      });
    }

    return items;
  }
}

// ---------------------------------------------------------------------------
// Strategy Context — orchestrates both strategies
// ---------------------------------------------------------------------------

/**
 * MrfGeneratorContext selects and executes the appropriate generation strategies.
 *
 * It:
 * 1. Builds the shared provider_references index (deduplicating providers)
 * 2. Runs both Professional and Institutional strategies
 * 3. Merges results into one CMS-compliant MrfDocument per (groupId, month)
 */
export class MrfGeneratorContext {
  private readonly strategies: MrfGenerationStrategy[] = [
    new ProfessionalClaimsStrategy(),
    new InstitutionalClaimsStrategy(),
  ];

  /**
   * Generate MRF documents grouped by (groupId, year-month).
   * @param claims - All approved claims to process
   * @returns Map of `{groupId}/{year-month}` → MrfDocument
   */
  generate(claims: Claim[]): Map<string, MrfDocument> {
    // Step 1: Group claims by (groupId, year-month of serviceDate)
    const claimsByGroup = this.groupClaimsByCustomerMonth(claims);

    const results = new Map<string, MrfDocument>();

    for (const [groupKey, groupClaims] of claimsByGroup) {
      const firstClaim = groupClaims[0];

      // Step 2: Build provider reference index for this group
      const { providerReferences, providerIndexMap } =
        this.buildProviderReferences(groupClaims);

      // Step 3: Run each strategy and merge in_network items
      const inNetworkItems: InNetworkItem[] = [];
      for (const strategy of this.strategies) {
        inNetworkItems.push(
          ...strategy.buildInNetworkItems(groupClaims, providerIndexMap)
        );
      }

      // Step 4: Build the root MRF document
      const doc: MrfDocument = {
        reporting_entity_name: firstClaim.groupName,
        reporting_entity_type: "health insurance issuer",
        plan_name: firstClaim.plan,
        plan_id_type: "GROUP",
        plan_id: firstClaim.groupId,
        plan_market_type: "group",
        last_updated_on: new Date().toISOString().split("T")[0],
        version: "1.0.0",
        provider_references: providerReferences,
        in_network: inNetworkItems,
      };

      results.set(groupKey, doc);
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Groups claims by "{groupId}/{YYYY-MM}" using the claim's service date */
  private groupClaimsByCustomerMonth(claims: Claim[]): Map<string, Claim[]> {
    const groups = new Map<string, Claim[]>();

    for (const claim of claims) {
      // Extract YYYY-MM from the service date (format: YYYY-MM-DD)
      const yearMonth = claim.serviceDate.substring(0, 7);
      const key = `${claim.groupId}/${yearMonth}`;

      const existing = groups.get(key) ?? [];
      existing.push(claim);
      groups.set(key, existing);
    }

    return groups;
  }

  /** Builds a deduplicated list of provider references from the claim set */
  private buildProviderReferences(claims: Claim[]): {
    providerReferences: ProviderReference[];
    providerIndexMap: Map<string, number>;
  } {
    // Deduplicate providers by providerId
    const providerMap = new Map<
      string,
      { providerId: string; providerName: string }
    >();
    for (const claim of claims) {
      if (!providerMap.has(claim.providerId)) {
        providerMap.set(claim.providerId, {
          providerId: claim.providerId,
          providerName: claim.providerName,
        });
      }
    }

    const providerReferences: ProviderReference[] = [];
    const providerIndexMap = new Map<string, number>();
    let index = 0;

    for (const [providerId] of providerMap) {
      providerReferences.push({
        provider_group_id: index,
        provider_groups: [
          {
            // providerId is used as a stand-in NPI (TIN ignored per spec note)
            npi: [providerId],
          },
        ],
      });
      providerIndexMap.set(providerId, index);
      index++;
    }

    return { providerReferences, providerIndexMap };
  }
}

// ---------------------------------------------------------------------------
// Helper: Map display place-of-service string to a CMS service code
// ---------------------------------------------------------------------------

const PLACE_OF_SERVICE_CODE_MAP: Record<string, string> = {
  "Inpatient Hospital": "21",
  "Outpatient Hospital": "22",
  "Emergency Room - Hospital": "23",
  Office: "11",
  Telehealth: "02",
  "Urgent Care": "20",
  Other: "99",
};

function mapPlaceOfServiceToCode(placeOfService: string): string {
  return PLACE_OF_SERVICE_CODE_MAP[placeOfService] ?? "99";
}
