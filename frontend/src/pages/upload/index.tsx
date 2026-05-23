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
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #050d05 0%, #0a1a0a 100%)" }}>
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
                style={{ borderRadius: 6 }}
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

            <Title order={1} c="white" fw={700}>
              Upload Claims CSV
            </Title>
            <Text c="dimmed" mt={8} maw={600}>
              Upload your monthly claims export. We'll parse, validate, and
              present every row for your review before generating the
              CMS-compliant MRF JSON files.
            </Text>
          </div>

          <Divider color="rgba(255,255,255,0.08)" />

          {/* ── Upload Widget ─────────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-white/10 p-6 md:p-8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <Text size="sm" fw={600} c="white" mb={16}>
              📂 Select CSV File
            </Text>
            <FileUpload />
          </div>

          {/* ── CSV Format Reference ───────────────────────────────────── */}
          <div
            className="rounded-2xl border border-white/5 p-5"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <Text size="sm" fw={600} c="dimmed" mb={10}>
              Expected CSV Columns
            </Text>
            <div className="flex flex-wrap gap-2">
              {[
                "Claim ID",
                "Subscriber ID",
                "Member Sequence",
                "Claim Status",
                "Billed",
                "Allowed",
                "Paid",
                "Service Date",
                "Place of Service",
                "Claim Type",
                "Procedure Code",
                "Provider ID",
                "Provider Name",
                "Group Name",
                "Group ID",
                "Plan",
                "Plan ID",
              ].map((col) => (
                <Badge
                  key={col}
                  variant="outline"
                  color="gray"
                  size="xs"
                  ff="monospace"
                >
                  {col}
                </Badge>
              ))}
            </div>
          </div>

          {/* ── Proceed to Review ──────────────────────────────────────── */}
          {hasValidClaims && (
            <div
              className="rounded-2xl border border-green-800/30 p-5 bg-green-950/20"
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text size="sm" fw={600} c="green.3">
                    ✅ {claimsStore.totalCount} claims ready for review
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {uploadStore.validationErrors.length > 0
                      ? `${uploadStore.errorRowCount} rows excluded due to validation errors`
                      : "All rows passed validation"}
                  </Text>
                </div>
                <Button
                  id="proceed-to-review"
                  size="md"
                  color="green"
                  onClick={() => navigate("/review")}
                  rightSection={<span>→</span>}
                >
                  Review Claims
                </Button>
              </Group>
            </div>
          )}
        </Stack>
      </Container>
    </div>
  );
});

export default UploadPage;
