/**
 * @file review/index.tsx
 * @description Claims review and approval page — Step 2 of the MRF workflow.
 *
 * Allows authenticated users to:
 *  1. Review all parsed claims in an AG Grid table
 *  2. Edit individual cell values inline
 *  3. Remove unwanted claims
 *  4. Toggle approval per claim (or bulk approve/reject)
 *  5. Submit approved claims to the backend for MRF generation
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
  Alert,
  Divider,
  Loader,
  Box,
} from "@mantine/core";
import { authStore, claimsStore, mrfStore } from "../../stores/appStore";
import ClaimsTable from "../../components/ClaimsTable";

const ReviewPage = observer(() => {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    if (!authStore.isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authStore.isAuthenticated, navigate]);

  if (!authStore.isAuthenticated) return null;

  const handleGenerateMrf = async () => {
    await mrfStore.generateMrf();
  };

  const hasApproved = claimsStore.approvedCount > 0;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #050d05 0%, #0a1a0a 100%)" }}>
      <Container size="xl" py={40}>
        <Stack gap={28}>
          {/* ── Page Header ───────────────────────────────────────────── */}
          <div>
            {/* Step indicator */}
            <Group gap={8} mb={12}>
              <Badge size="sm" variant="outline" color="green"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/upload")}
              >
                ✓ Step 1: Upload
              </Badge>
              <Badge size="sm" variant="filled" color="green">
                Step 2
              </Badge>
              <Badge size="sm" variant="outline" color="gray">
                Step 3: Generate
              </Badge>
            </Group>

            <Group justify="space-between" align="flex-end">
              <div>
                <Title order={1} c="white" fw={700}>
                  Review & Approve Claims
                </Title>
                <Text c="dimmed" mt={8}>
                  Approve the claims you want included in the MRF output.
                  You can edit cell values or remove rows before submitting.
                </Text>
              </div>

              <Button
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => navigate("/upload")}
              >
                ← Back to Upload
              </Button>
            </Group>
          </div>

          <Divider color="rgba(255,255,255,0.08)" />

          {/* ── No Claims State ───────────────────────────────────────── */}
          {claimsStore.totalCount === 0 && (
            <Box className="text-center py-20">
              <Text size="lg" c="dimmed" mb={16}>
                No claims loaded yet.
              </Text>
              <Button
                color="green"
                onClick={() => navigate("/upload")}
              >
                Go to Upload
              </Button>
            </Box>
          )}

          {/* ── Claims Table ──────────────────────────────────────────── */}
          {claimsStore.totalCount > 0 && (
            <div
              className="rounded-2xl border border-white/10 p-4 md:p-6"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <ClaimsTable />
            </div>
          )}

          {/* ── Generation Result ─────────────────────────────────────── */}
          {mrfStore.generationResult && (
            <Alert
              color="green"
              title="✅ MRF Files Generated Successfully"
              radius="lg"
            >
              <Stack gap={8}>
                <Text size="sm" c="green.3">
                  {mrfStore.generationResult.message} from{" "}
                  {mrfStore.generationResult.claimsProcessed} approved claims.
                </Text>
                <div className="flex flex-wrap gap-2">
                  {mrfStore.generationResult.files.map((file) => (
                    <Badge
                      key={file}
                      variant="outline"
                      color="green"
                      size="sm"
                      ff="monospace"
                    >
                      {file}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  onClick={() => navigate("/mrf")}
                  mt={4}
                >
                  View MRF Files →
                </Button>
              </Stack>
            </Alert>
          )}

          {/* ── Generation Error ──────────────────────────────────────── */}
          {mrfStore.generationError && (
            <Alert color="red" title="Generation Failed" radius="lg">
              {mrfStore.generationError}
            </Alert>
          )}

          {/* ── Submit Bar ────────────────────────────────────────────── */}
          {claimsStore.totalCount > 0 && (
            <div
              className="sticky bottom-0 rounded-2xl border border-white/10 p-4"
              style={{
                background: "rgba(5, 13, 5, 0.9)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap={12}>
                  <div>
                    <Text size="xs" c="dimmed">
                      Selected for generation
                    </Text>
                    <Text size="lg" fw={700} c="white">
                      {claimsStore.approvedCount}{" "}
                      <Text span size="sm" c="dimmed" fw={400}>
                        of {claimsStore.totalCount} claims
                      </Text>
                    </Text>
                  </div>

                  {claimsStore.approvedCount > 0 && (
                    <Badge color="green" variant="filled" size="lg">
                      Ready to Generate
                    </Badge>
                  )}
                </Group>

                <Group gap={8}>
                  {mrfStore.isGenerating && (
                    <Group gap={6}>
                      <Loader size="xs" color="green" />
                      <Text size="sm" c="dimmed">
                        Generating…
                      </Text>
                    </Group>
                  )}

                  <Button
                    id="generate-mrf-btn"
                    size="md"
                    color="green"
                    disabled={!hasApproved || mrfStore.isGenerating}
                    loading={mrfStore.isGenerating}
                    onClick={handleGenerateMrf}
                    leftSection={<span>⚡</span>}
                  >
                    Generate MRF Files
                  </Button>
                </Group>
              </Group>
            </div>
          )}
        </Stack>
      </Container>
    </div>
  );
});

export default ReviewPage;
