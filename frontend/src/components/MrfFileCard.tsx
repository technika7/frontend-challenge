/**
 * @file MrfFileCard.tsx
 * @description Card component for displaying a single MRF file entry.
 */

import { Card, Group, Text, Badge, Anchor, Stack, Divider } from "@mantine/core";
import type { MrfFileMeta } from "../utils/mrfMapper";
import { getMrfDownloadUrl } from "../services/mrfService";

interface MrfFileCardProps {
  file: MrfFileMeta;
  /** If true, highlights the card (e.g., recently generated) */
  isNew?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Parses "2024-10" into "October 2024" */
function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function MrfFileCard({ file, isNew = false }: MrfFileCardProps) {
  const downloadUrl = getMrfDownloadUrl(file.url);

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{
        border: isNew ? "1px solid #86efac" : "1px solid #e2e8f0",
        backgroundColor: isNew ? "#f0fdf4" : "#ffffff",
        transition: "all 150ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      className="hover:-translate-y-0.5 hover:shadow-md"
    >
      <Stack gap={12}>
        {/* ── Header Row ─────────────────────────────────────────── */}
        <Group justify="space-between" align="flex-start">
          <Group gap={10}>
            {/* File type icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#dcfce7",
                border: "1px solid #86efac",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "0.65rem", color: "#15803d", fontWeight: 700 }}>
                JSON
              </span>
            </div>
            <div>
              <Text size="sm" fw={600} c="slate.7" lh={1.2}>
                {formatYearMonth(file.yearMonth)}
              </Text>
              <Text size="xs" c="dimmed" lh={1.3}>
                Allowed Amounts MRF
              </Text>
            </div>
          </Group>

          <Group gap={6}>
            {isNew && (
              <Badge color="green" variant="filled" size="xs" radius="sm">
                New
              </Badge>
            )}
            <Badge variant="light" color="slate" size="xs" radius="sm">
              {file.customer}
            </Badge>
          </Group>
        </Group>

        <Divider color="#f1f5f9" />

        {/* ── File Metadata ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <Text size="xs" c="dimmed" mb={1}>Period</Text>
            <Text size="xs" fw={600} c="slate.7">{file.yearMonth}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed" mb={1}>File Size</Text>
            <Text size="xs" fw={600} c="slate.7">{formatBytes(file.sizeBytes)}</Text>
          </div>
          <div className="col-span-2">
            <Text size="xs" c="dimmed" mb={1}>Last Updated</Text>
            <Text size="xs" fw={600} c="slate.5">{formatDate(file.lastModified)}</Text>
          </div>
        </div>

        {/* ── Download Link ──────────────────────────────────────── */}
        <Group
          justify="space-between"
          align="center"
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: 8,
            marginTop: 4,
          }}
        >
          <Text size="xs" c="dimmed" ff="monospace" truncate maw={180}>
            {file.fileName}
          </Text>
          <Anchor
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            fw={600}
            c="green.8"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            ↓ Download
          </Anchor>
        </Group>
      </Stack>
    </Card>
  );
}
