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
      color="orange"
      title={
        <div className="flex items-center gap-2">
          <span>⚠️ Validation Warnings</span>
          <Badge color="orange" size="sm" variant="filled">
            {errors.length} / {totalRows} rows
          </Badge>
        </div>
      }
      className="border border-orange-800/40"
    >
      <Stack gap={8}>
        <Text size="sm" c="orange.3">
          {errors.length} row{errors.length !== 1 ? "s" : ""} had validation
          errors and were excluded from the claims table. Valid rows are still
          available for review.
        </Text>

        <Button
          variant="subtle"
          color="orange"
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
                  className="bg-orange-950/30 border border-orange-800/20 rounded-md p-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge size="xs" color="orange" variant="outline">
                      Row {err.rowIndex + 2}
                    </Badge>
                    {err.claimId && (
                      <Text size="xs" c="dimmed" ff="monospace">
                        ID: {err.claimId}
                      </Text>
                    )}
                  </div>
                  <Stack gap={2}>
                    {Object.entries(err.fieldErrors).map(([field, msgs]) => (
                      <Text key={field} size="xs" c="orange.4">
                        <Text span fw={600} c="orange.3">
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
