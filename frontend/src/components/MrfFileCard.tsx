/**
 * @file MrfFileCard.tsx
 * @description Card component for displaying a single MRF file entry.
 *
 * Shows:
 *  - Customer group ID
 *  - Year-month period covered
 *  - File size
 *  - Last modified timestamp
 *  - Download link
 */

import { Card, Group, Text, Badge, Anchor, Stack } from "@mantine/core";
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
      radius="lg"
      p="md"
      className={`
        transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg
        ${isNew ? "border-green-600/50 bg-green-950/20" : "border-white/10"}
      `}
      style={{
        background: isNew
          ? "rgba(0, 69, 2, 0.1)"
          : "rgba(255, 255, 255, 0.03)",
      }}
    >
      <Stack gap={12}>
        {/* ── Header Row ────────────────────────────────────────────── */}
        <Group justify="space-between" align="flex-start">
          <Group gap={8}>
            <div className="w-8 h-8 rounded-lg bg-green-900/40 border border-green-800/30 flex items-center justify-center">
              <span className="text-xs text-green-400 font-bold">JSON</span>
            </div>
            <div>
              <Text size="sm" fw={600} c="white" lh={1.2}>
                {formatYearMonth(file.yearMonth)}
              </Text>
              <Text size="xs" c="dimmed">
                Allowed Amounts MRF
              </Text>
            </div>
          </Group>

          <Group gap={6}>
            {isNew && (
              <Badge color="green" variant="filled" size="xs">
                New
              </Badge>
            )}
            <Badge variant="outline" color="gray" size="xs">
              {file.customer}
            </Badge>
          </Group>
        </Group>

        {/* ── File Metadata ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Text size="xs" c="dimmed">
              Period
            </Text>
            <Text size="xs" c="white" fw={500}>
              {file.yearMonth}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              File Size
            </Text>
            <Text size="xs" c="white" fw={500}>
              {formatBytes(file.sizeBytes)}
            </Text>
          </div>
          <div className="col-span-2">
            <Text size="xs" c="dimmed">
              Last Updated
            </Text>
            <Text size="xs" c="white" fw={500}>
              {formatDate(file.lastModified)}
            </Text>
          </div>
        </div>

        {/* ── Download Link ──────────────────────────────────────────── */}
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed" ff="monospace" truncate maw={200}>
            {file.fileName}
          </Text>
          <Anchor
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="green.4"
            className="flex items-center gap-1 hover:text-green-300 transition-colors"
          >
            ↓ Download
          </Anchor>
        </Group>
      </Stack>
    </Card>
  );
}
