/**
 * @file StatusBadge.tsx
 * @description Colored badge component for claim status values.
 *
 * Maps:
 *  - "Payable"      → green
 *  - "Denied"       → red
 *  - "Partial Deny" → yellow/orange
 */

import { Badge } from "@mantine/core";
import type { CLAIM_STATUS_VALUES } from "../utils/csvValidator";

type ClaimStatus = (typeof CLAIM_STATUS_VALUES)[number];

interface StatusBadgeProps {
  status: ClaimStatus | string;
}

const STATUS_COLOR: Record<string, string> = {
  Payable: "emerald",
  Denied: "rose",
  "Partial Deny": "amber",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLOR[status] ?? "gray";
  return (
    <Badge color={color} variant="light" size="sm" radius="sm">
      {status}
    </Badge>
  );
}
