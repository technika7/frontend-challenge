/**
 * @file mrf/index.tsx
 * @description Public MRF Files index page — accessible without authentication.
 *
 * Displays all generated MRF JSON files grouped by customer, similar to
 * the public index at https://my.clearesthealth.com/mrf/ehs
 *
 * Features:
 *  - Fetches the file list from GET /api/mrf/files on mount
 *  - Groups files by customer
 *  - Each customer section links to /mrf/:customer for a dedicated view
 *  - Shows downloadable MRF file cards
 *  - Loading and empty states
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
  Loader,
  Center,
  Alert,
  Divider,
  SimpleGrid,
  Anchor,
} from "@mantine/core";
import { mrfStore, authStore } from "../../stores/appStore";
import MrfFileCard from "../../components/MrfFileCard";

const MrfPublicPage = observer(() => {
  const navigate = useNavigate();

  // Fetch all MRF files when page mounts
  useEffect(() => {
    mrfStore.fetchAllFiles();
  }, []);

  const groupedFiles = mrfStore.uniqueCustomers.map((customer) => ({
    customer,
    files: mrfStore.allFiles.filter((f) => f.customer === customer),
  }));

  return (
    <div className="flex flex-col flex-1">
      <Container size="xl" py={48}>
        <Stack gap={40}>
          {/* ── Page Header ───────────────────────────────────────────── */}
          <div>
            <Group gap={8} mb={12}>
              <Badge variant="outline" color="green" size="sm">
                Public
              </Badge>
              <Badge variant="outline" color="gray" size="sm">
                No login required
              </Badge>
            </Group>

            <Title order={1} fw={700} mb={8}>
              Machine-Readable Files
            </Title>
            <Text c="dimmed" maw={640} size="md">
              In compliance with the CMS Transparency in Coverage Rule (45 CFR
              §147.210), health plan allowed amount files are published monthly
              in machine-readable JSON format.
            </Text>

            <Divider mt={24} color="#e2e8f0" />
          </div>

          {/* ── Loading State ─────────────────────────────────────────── */}
          {mrfStore.isFetchingFiles && (
            <Center py={60}>
              <Stack align="center" gap={12}>
                <Loader color="green" size="md" />
                <Text c="dimmed" size="sm">
                  Loading MRF file index…
                </Text>
              </Stack>
            </Center>
          )}

          {/* ── Fetch Error ───────────────────────────────────────────── */}
          {mrfStore.fetchError && (
            <Alert color="amber" title="Unable to Load Files" radius="md">
              <Stack gap={8}>
                <Text size="sm">{mrfStore.fetchError}</Text>
                <Text size="sm" c="dimmed">
                  Make sure the backend API server is running at{" "}
                  <Text span ff="monospace" size="xs">
                    http://localhost:8080
                  </Text>
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  color="amber"
                  onClick={() => mrfStore.fetchAllFiles()}
                >
                  Retry
                </Button>
              </Stack>
            </Alert>
          )}

          {/* ── Empty State ───────────────────────────────────────────── */}
          {!mrfStore.isFetchingFiles &&
            !mrfStore.fetchError &&
            mrfStore.allFiles.length === 0 && (
              <Center py={80}>
                <Stack align="center" gap={16} maw={440} ta="center">
                  <div className="text-5xl">📂</div>
                  <Title order={3}>
                    No MRF Files Yet
                  </Title>
                  <Text c="dimmed" size="sm">
                    MRF files will appear here once a plan administrator uploads
                    claims and generates the JSON output.
                  </Text>
                  <Button
                    variant="light"
                    color="green"
                    onClick={() => navigate(authStore.isAuthenticated ? "/upload" : "/login")}
                  >
                    {authStore.isAuthenticated ? "Upload Claims to Generate" : "Sign in to Generate Files"}
                  </Button>
                </Stack>
              </Center>
            )}

          {/* ── Files grouped by customer ─────────────────────────────── */}
          {!mrfStore.isFetchingFiles && groupedFiles.length > 0 && (
            <Stack gap={36}>
              {groupedFiles.map(({ customer, files }) => (
                <div key={customer}>
                  {/* Customer header */}
                  <Group justify="space-between" align="center" mb={16}>
                    <Group gap={10}>
                      <div className="w-2 h-8 rounded-full bg-gradient-to-b from-green-500 to-green-800" />
                      <div>
                        <Group gap={8}>
                          <Text fw={700} size="lg">
                            {customer}
                          </Text>
                          <Badge variant="light" color="green" size="sm" radius="sm">
                            {files.length} file{files.length !== 1 ? "s" : ""}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          Health Plan Group Identifier
                        </Text>
                      </div>
                    </Group>

                    <Anchor
                      component="button"
                      onClick={() => navigate(`/mrf/${customer}`)}
                      size="sm"
                c="green.8"
                    >
                      View all →
                    </Anchor>
                  </Group>

                  {/* File cards grid */}
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={12}>
                    {files.map((file) => (
                      <MrfFileCard
                        key={`${file.customer}-${file.fileName}`}
                        file={file}
                      />
                    ))}
                  </SimpleGrid>
                </div>
              ))}
            </Stack>
          )}

          {/* ── Regulatory Footer ─────────────────────────────────────── */}
          <Divider color="#e2e8f0" mt={20} />
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              Published pursuant to 45 CFR §147.210 — Transparency in Coverage
              Final Rule
            </Text>
            <Text size="xs" c="dimmed">
              Format specification:{" "}
              <Anchor
                href="https://github.com/CMSgov/price-transparency-guide/tree/master/schemas/allowed-amounts"
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                c="green.8"
              >
                CMS Price Transparency Guide — Allowed Amounts Schema
              </Anchor>
            </Text>
          </Stack>
        </Stack>
      </Container>
    </div>
  );
});

export default MrfPublicPage;
