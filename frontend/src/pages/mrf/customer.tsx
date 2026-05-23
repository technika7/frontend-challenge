/**
 * @file mrf/customer.tsx
 * @description Public per-customer MRF files page.
 *
 * Displays all MRF files for a specific customer group ID (e.g., "ACM001").
 * Accessible publicly without authentication, similar to the clearesthealth.com example.
 *
 * URL: /mrf/:customer
 */

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
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
import { mrfStore } from "../../stores/appStore";
import MrfFileCard from "../../components/MrfFileCard";

const CustomerMrfPage = observer(() => {
  const { customer } = useParams<{ customer: string }>();
  const navigate = useNavigate();

  // Fetch customer-specific files on mount or when customer ID changes
  useEffect(() => {
    if (customer) {
      mrfStore.fetchCustomerFiles(customer);
    }
  }, [customer]);

  if (!customer) {
    return (
      <Center py={80}>
        <Text c="dimmed">Invalid customer ID</Text>
      </Center>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Container size="xl" py={48}>
        <Stack gap={36}>
          {/* ── Breadcrumb ────────────────────────────────────────────── */}
          <Group gap={8}>
            <Anchor
              component="button"
              onClick={() => navigate("/mrf")}
              size="sm"
              c="green.8"
            >
              ← MRF Index
            </Anchor>
            <Text c="dimmed" size="sm">
              /
            </Text>
            <Text size="sm" fw={600}>
              {customer}
            </Text>
          </Group>

          {/* ── Page Header ───────────────────────────────────────────── */}
          <div>
            <Group gap={10} mb={8}>
              <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center">
                <span className="text-green-700 font-bold text-sm">
                  {customer.slice(0, 2)}
                </span>
              </div>
              <div>
                <Title order={1} fw={700}>
                  {customer}
                </Title>
                <Text c="dimmed" size="sm">
                  Allowed Amounts — Machine-Readable Files
                </Text>
              </div>
            </Group>

            <Divider mt={20} color="#e2e8f0" />
          </div>

          {/* ── Loading State ─────────────────────────────────────────── */}
          {mrfStore.isFetchingFiles && (
            <Center py={60}>
              <Stack align="center" gap={12}>
                <Loader color="green" />
                <Text c="dimmed" size="sm">
                  Loading files for {customer}…
                </Text>
              </Stack>
            </Center>
          )}

          {/* ── Fetch Error ───────────────────────────────────────────── */}
          {mrfStore.fetchError && (
            <Alert color="amber" title="Error Loading Files" radius="md">
              <Text size="sm">{mrfStore.fetchError}</Text>
              <Button
                size="xs"
                variant="outline"
                color="amber"
                mt={8}
                onClick={() => mrfStore.fetchCustomerFiles(customer)}
              >
                Retry
              </Button>
            </Alert>
          )}

          {/* ── Empty State ───────────────────────────────────────────── */}
          {!mrfStore.isFetchingFiles &&
            !mrfStore.fetchError &&
            mrfStore.customerFiles.length === 0 && (
              <Center py={60}>
                <Stack align="center" gap={12} ta="center">
                  <div className="text-4xl">📭</div>
                  <Text size="lg" fw={500}>
                    No files for {customer}
                  </Text>
                  <Text size="sm" c="dimmed">
                    This customer group has no published MRF files yet.
                  </Text>
                  <Button
                    variant="subtle"
                    color="green"
                    onClick={() => navigate("/mrf")}
                  >
                    Back to Index
                  </Button>
                </Stack>
              </Center>
            )}

          {/* ── File Cards ────────────────────────────────────────────── */}
          {!mrfStore.isFetchingFiles && mrfStore.customerFiles.length > 0 && (
            <Stack gap={16}>
              <Group justify="space-between" align="center">
                <Group gap={8}>
                  <Text size="sm" fw={600}>
                    Published Files
                  </Text>
                  <Badge color="green" variant="light" size="sm" radius="sm">
                    {mrfStore.customerFiles.length} file
                    {mrfStore.customerFiles.length !== 1 ? "s" : ""}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  Sorted by period (newest first)
                </Text>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={14}>
                {mrfStore.customerFiles.map((file) => (
                  <MrfFileCard
                    key={`${file.customer}-${file.fileName}`}
                    file={file}
                  />
                ))}
              </SimpleGrid>
            </Stack>
          )}

          {/* ── Regulatory Note ───────────────────────────────────────── */}
          <Divider color="#e2e8f0" />
          <Text size="xs" c="dimmed">
            These files are published in compliance with 45 CFR §147.210. For
            questions, contact your plan administrator.{" "}
            <Anchor
              href="https://github.com/CMSgov/price-transparency-guide/tree/master/schemas/allowed-amounts"
              target="_blank"
              size="xs"
              c="green.8"
            >
              Schema reference →
            </Anchor>
          </Text>
        </Stack>
      </Container>
    </div>
  );
});

export default CustomerMrfPage;
