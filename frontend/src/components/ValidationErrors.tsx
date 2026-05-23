/**
 * @file ValidationErrors.tsx
 * @description Displays a collapsible list of CSV validation errors.
 *
 * Shows:
 *  - A summary count of rows with errors
 *  - Per-row details: row number, claim ID, and all field-level error messages
 *  - A "Show/Hide Details" toggle to keep the UI clean when there are many errors
 */

import { useState } from "react";
import {
  Alert,
  Collapse,
  Button,
  Text,
  Badge,
  Stack,
  Box,
  ScrollArea,
} from "@mantine/core";
import type { ClaimValidationError } from "../utils/csvValidator";

interface ValidationErrorsProps {
  errors: ClaimValidationError[];
  totalRows: number;
}

export default function ValidationErrors({
  errors,
  totalRows,
}: ValidationErrorsProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (errors.length === 0) return null;

  return (
    <Alert
      color="amber"
      title={
        <div className="flex items-center gap-2">
          <span>⚠️ Validation Warnings</span>
          <Badge color="amber" size="sm" variant="light">
            {errors.length} / {totalRows} rows
          </Badge>
        </div>
      }
      className="border border-amber-300 bg-amber-50"
    >
      <Stack gap={8}>
        <Text size="sm" c="amber.9" fw={500}>
          {errors.length} row{errors.length !== 1 ? "s" : ""} had validation
          errors and were excluded from the claims table. Valid rows are still
          available for review.
        </Text>

        <Button
          variant="subtle"
          color="amber"
          size="xs"
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? "Hide Details" : "Show Error Details"}
        </Button>

        <Collapse in={showDetails}>
          <ScrollArea.Autosize mah={300}>
            <Stack gap={6} pt={4}>
              {errors.slice(0, 50).map((err) => (
                <Box
                  key={err.rowIndex}
                  className="bg-amber-100/70 border border-amber-300 rounded-md p-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge size="lg" color="amber" variant="light">
                      Row {err.rowIndex + 2}
                    </Badge>
                    {err.claimId && (
                      <Text size="sm" c="dimmed" ff="monospace" fw={500}>
                        ID: {err.claimId}
                      </Text>
                    )}
                  </div>
                  <Stack gap={2}>
                    {Object.entries(err.fieldErrors).map(([field, msgs]) => (
                      <Text key={field} size="xs" c="amber.9">
                        <Text span fw={600} c="amber.9">
                          {field}:
                        </Text>{" "}
                        {msgs.join(", ")}
                      </Text>
                    ))}
                  </Stack>
                </Box>
              ))}
              {errors.length > 50 && (
                <Text size="xs" c="dimmed" ta="center">
                  … and {errors.length - 50} more errors
                </Text>
              )}
            </Stack>
          </ScrollArea.Autosize>
        </Collapse>
      </Stack>
    </Alert>
  );
}
