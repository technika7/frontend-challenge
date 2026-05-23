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

import { useEffect, useState } from "react";
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
  Box,
  Drawer,
  Modal,
} from "@mantine/core";
import { authStore, claimsStore, mrfStore } from "../../stores/appStore";
import type { EditableClaim } from "../../stores/appStore";
import ClaimsTable from "../../components/ClaimsTable";

const ReviewPage = observer(() => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<EditableClaim | null>(null);
  const [claimToRemove, setClaimToRemove] = useState<EditableClaim | null>(null);

  // Still allow viewing claim details in the Drawer when clicking a row (optional, but good UX)

  const handleRemoveClick = (claim: EditableClaim) => {
    setClaimToRemove(claim);
  };

  const confirmRemove = () => {
    if (claimToRemove) {
      claimsStore.removeClaim(claimToRemove._id);
      setClaimToRemove(null);
    }
  };

  // Auth guard
  useEffect(() => {
    if (!authStore.isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authStore.isAuthenticated, navigate]);

  if (!authStore.isAuthenticated) return null;

  const handleGenerateMrf = async () => {
    setDrawerOpen(false);
    await mrfStore.generateMrf();
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const hasApproved = claimsStore.approvedCount > 0;

  return (
    <div className="flex flex-col flex-1">
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
                <Title order={1} fw={700}>
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

          <Divider color="#e2e8f0" />

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
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 md:p-6">
              <ClaimsTable onRemove={handleRemoveClick} />
            </div>
          )}

          {/* ── Generation Result ─────────────────────────────────────── */}
          {mrfStore.generationResult && (
            <Alert
              color="green"
              title="✅ MRF Files Generated Successfully"
              radius="md"
              className="border border-green-300 bg-green-50"
            >
              <Stack gap={8}>
                <Text size="sm" fw={500} c="green.9">
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
                  variant="filled"
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
            <Alert color="rose" title="Generation Failed" radius="md">
              {mrfStore.generationError}
            </Alert>
          )}

          {/* ── Action Panel ────────────────────────────────────────────── */}
          {claimsStore.totalCount > 0 && (
            <div className="flex justify-end sticky bottom-6 z-10">
              <Button
                size="lg"
                color="green"
                radius="xl"
                onClick={() => { setSelectedClaim(null); setDrawerOpen(true); }}
                className="shadow-xl shadow-green-900/20 border border-green-500/50"
                leftSection={<span>⚡</span>}
              >
                Review & Generate ({claimsStore.approvedCount} Ready)
              </Button>
            </div>
          )}
        </Stack>
      </Container>

      {/* ── Detail & Generation Drawer ────────────────────────────── */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="right"
        size="md"
        padding="lg"
        title={
          <Text fw={700} size="lg">
            {selectedClaim ? "Claim Details" : "Generation Summary"}
          </Text>
        }
        styles={{
          content: { backgroundColor: "#ffffff", borderLeft: "1px solid #e2e8f0" },
          header: { backgroundColor: "#ffffff" },
          title: { color: "#0f172a" },
          close: { color: "#64748b" }
        }}
      >
        <Stack gap={24} style={{ height: "calc(100vh - 80px)" }} justify="space-between">
          <div className="overflow-y-auto pr-2">
            {selectedClaim ? (
              <Stack gap={16}>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Text size="xs" c="dimmed" mb={4}>Claim ID</Text>
                  <Text size="sm" ff="monospace" c="slate.8">{selectedClaim.claimId}</Text>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Text size="xs" c="dimmed" mb={4}>Provider</Text>
                  <Text size="sm" fw={500} c="slate.8">{selectedClaim.providerName}</Text>
                  <Text size="xs" c="dimmed" ff="monospace">{selectedClaim.providerId}</Text>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <Text size="xs" c="dimmed" mb={2}>Billed</Text>
                    <Text size="sm" fw={600} c="slate.8">${selectedClaim.billed}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed" mb={2}>Allowed</Text>
                    <Text size="sm" c="green.8" fw={700}>${selectedClaim.allowed}</Text>
                  </div>
                </div>

                <Button
                  variant={selectedClaim._approved ? "light" : "outline"}
                  color={selectedClaim._approved ? "green" : "slate"}
                  onClick={() => claimsStore.toggleApprove(selectedClaim._id)}
                  fullWidth
                >
                  {selectedClaim._approved ? "✓ Approved for MRF" : "Approve Claim"}
                </Button>
              </Stack>
            ) : (
              <Stack gap={16}>
                <Alert color="blue" variant="light" className="border border-blue-500/20">
                  Select a row in the table to view its full details here.
                </Alert>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Text size="sm" mb={8} fw={600} c="slate.8">Approval Status</Text>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Total Claims</Text>
                    <Text size="sm" c="slate.8">{claimsStore.totalCount}</Text>
                  </Group>
                  <Group justify="space-between" mt={4}>
                    <Text size="sm" c="dimmed">Approved</Text>
                    <Text size="sm" c="green.8" fw={600}>{claimsStore.approvedCount}</Text>
                  </Group>
                </div>
              </Stack>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <Button
              id="generate-mrf-btn"
              size="md"
              fullWidth
              color="green"
              radius="xl"
              disabled={!hasApproved || mrfStore.isGenerating}
              loading={mrfStore.isGenerating}
              onClick={handleGenerateMrf}
              leftSection={<span>⚡</span>}
            >
              Generate MRF Files
            </Button>
          </div>
        </Stack>
      </Drawer>

      {/* ── Confirm Remove Modal ────────────────────────────────────── */}
      <Modal
        opened={!!claimToRemove}
        onClose={() => setClaimToRemove(null)}
        title="Confirm Removal"
        centered
        styles={{
          header: { backgroundColor: "#ffffff" },
          content: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
          title: { color: "#0f172a", fontWeight: 600 },
          close: { color: "#64748b" }
        }}
      >
        <Text size="sm" c="dimmed" mb={24}>
          Are you sure you want to remove claim <Text span ff="monospace">{claimToRemove?.claimId}</Text>? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={() => setClaimToRemove(null)}>Cancel</Button>
          <Button color="red" onClick={confirmRemove}>Remove</Button>
        </Group>
      </Modal>
    </div>
  );
});

export default ReviewPage;
