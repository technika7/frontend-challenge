/**
 * @file upload/index.tsx
 * @description CSV upload page — Step 1 of the MRF generation workflow.
 *
 * Allows authenticated users to:
 *  1. Drag-and-drop or browse for a CSV claims file
 *  2. See parse progress and validation feedback
 *  3. Navigate to the review page once parsing succeeds
 *
 * Auth-protected: redirects to /login if unauthenticated.
 */

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Divider,
} from "@mantine/core";
import { authStore, uploadStore, claimsStore } from "../../stores/appStore";
import FileUpload from "../../components/FileUpload";
import { CSV_HEADER_MAP } from "../../utils/csvValidator";

const UploadPage = observer(() => {
  const navigate = useNavigate();

  // Auth guard — redirect unauthenticated users
  useEffect(() => {
    if (!authStore.isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authStore.isAuthenticated, navigate]);

  if (!authStore.isAuthenticated) return null;

  const hasValidClaims = claimsStore.totalCount > 0;

  return (
    <div className="flex flex-col flex-1">
      <Container size="lg" py={40}>
        <Stack gap={32}>
          {/* ── Page Header ───────────────────────────────────────────── */}
          <div>
            {/* Step indicator */}
            <Group gap={8} mb={12}>
              <Badge
                size="sm"
                variant="filled"
                color="green"
                radius="sm"
              >
                Step 1
              </Badge>
              <Badge size="sm" variant="outline" color="gray">
                Step 2: Review
              </Badge>
              <Badge size="sm" variant="outline" color="gray">
                Step 3: Generate
              </Badge>
            </Group>

            <Title order={1} fw={700}>
              Upload Claims Data
            </Title>
            <Text c="dimmed" mt={8} maw={600}>
              Upload your monthly claims export. We'll parse, validate, and
              present every row for your review before generating the
              CMS-compliant MRF JSON files.
            </Text>
          </div>

          <Divider color="#e2e8f0" />

          {/* ── Upload Widget ────────────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
            <Text size="sm" fw={600} c="slate" mb={16}>
              Select or drag your CSV file
            </Text>
            <FileUpload />
          </div>

          {/* ── CSV Format Reference ───────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <Text size="sm" fw={600} c="slate.4" mb={10}>
              Expected CSV Columns
            </Text>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CSV_HEADER_MAP).map((col) => {
                // Ignore case and trim when matching found headers, just to be robust
                const isFound = uploadStore.foundHeaders.some(
                  (h) => h.trim().toLowerCase() === col.trim().toLowerCase()
                );
                return (
                  <Badge
                    key={col}
                    variant={isFound ? "light" : "outline"}
                    color={isFound ? "green" : "gray"}
                    size="xs"
                    ff="monospace"
                  >
                    {col} {isFound && "✓"}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* ── Proceed to Review ──────────────────────────────────────── */}
          {hasValidClaims && (
            <div className="flex justify-end sticky bottom-6 z-10 mt-8">
              <Button
                id="proceed-to-review"
                size="lg"
                color="green"
                radius="xl"
                onClick={() => navigate("/review")}
                className="shadow-xl shadow-green-900/20 border border-green-500/50"
                rightSection={<span>→</span>}
              >
                Review {claimsStore.totalCount} Claims
              </Button>
            </div>
          )}
        </Stack>
      </Container>
    </div>
  );
});

export default UploadPage;
