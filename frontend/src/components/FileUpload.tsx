/**
 * @file FileUpload.tsx
 * @description CSV file upload component using Mantine's Dropzone.
 *
 * Features:
 *  - Drag-and-drop or click-to-browse file selection
 *  - Accepts only .csv files
 *  - Shows selected file name and size
 *  - Error handling for wrong file type or oversized files
 *  - Triggers CSV parsing + validation via the MobX uploadStore
 */

import { useRef } from "react";
import { observer } from "mobx-react-lite";
import {
  Group,
  Text,
  Stack,
  Button,
  Progress,
  Badge,
  Box,
  rem,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import "@mantine/dropzone/styles.css";
import { uploadStore, claimsStore } from "../stores/appStore";
import ValidationErrors from "./ValidationErrors";

const FileUpload = observer(() => {
  const openRef = useRef<() => void>(null);

  const handleDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Reset previous claims before parsing new file
    claimsStore.reset();
    await uploadStore.parseAndValidate(file);
  };

  const handleReject = () => {
    // Mantine Dropzone calls this if the file doesn't match MIME type/size
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Stack gap={16}>
      {/* ── Dropzone ──────────────────────────────────────────────── */}
      <Dropzone
        onDrop={handleDrop}
        onReject={handleReject}
        maxSize={50 * 1024 * 1024} // 50 MB limit
        accept={["text/csv", "application/vnd.ms-excel", ".csv"]}
        loading={uploadStore.isLoading}
        openRef={openRef}
        className="border-2 border-dashed border-green-800/40 hover:border-green-600/60 transition-all duration-300 rounded-xl"
        style={{
          background: "rgba(0, 69, 2, 0.05)",
        }}
      >
        <Group
          justify="center"
          gap={20}
          mih={200}
          style={{ pointerEvents: "none" }}
          py={40}
        >
          <Dropzone.Accept>
            <div className="text-green-400 text-5xl">✅</div>
          </Dropzone.Accept>
          <Dropzone.Reject>
            <div className="text-red-400 text-5xl">❌</div>
          </Dropzone.Reject>
          <Dropzone.Idle>
            <div className="flex flex-col items-center gap-4">
              {/* Upload icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-700/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div className="text-center">
                <Text size="lg" fw={600} c="white">
                  Drop your CSV file here
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  or{" "}
                  <Text
                    span
                    c="green.4"
                    style={{ cursor: "pointer" }}
                    onClick={() => openRef.current?.()}
                  >
                    browse to upload
                  </Text>
                </Text>
              </div>

              <div className="flex gap-3 mt-2">
                <Badge variant="outline" color="gray" size="sm">
                  .csv
                </Badge>
                <Badge variant="outline" color="gray" size="sm">
                  Max 50 MB
                </Badge>
              </div>
            </div>
          </Dropzone.Idle>
        </Group>
      </Dropzone>

      {/* ── Loading Progress ───────────────────────────────────────── */}
      {uploadStore.isLoading && (
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Parsing and validating CSV…
          </Text>
          <Progress value={100} animated color="green" size="sm" radius="xl" />
        </Box>
      )}

      {/* ── Selected File Info ─────────────────────────────────────── */}
      {uploadStore.file && !uploadStore.isLoading && (
        <Box className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Group justify="space-between" align="center">
            <Group gap={10}>
              <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center">
                <span className="text-xs text-green-400 font-bold">CSV</span>
              </div>
              <div>
                <Text size="sm" fw={500} c="white">
                  {uploadStore.file.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatBytes(uploadStore.file.size)}
                </Text>
              </div>
            </Group>

            {uploadStore.isSuccess && (
              <Group gap={8}>
                <Badge color="green" variant="light" size="sm">
                  ✓ {uploadStore.validRowCount} valid
                </Badge>
                {uploadStore.errorRowCount > 0 && (
                  <Badge color="orange" variant="light" size="sm">
                    ⚠ {uploadStore.errorRowCount} errors
                  </Badge>
                )}
              </Group>
            )}
          </Group>
        </Box>
      )}

      {/* ── Parse Error ────────────────────────────────────────────── */}
      {uploadStore.parseError && (
        <Box className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
          <Text size="sm" c="red.4">
            ⛔ {uploadStore.parseError}
          </Text>
        </Box>
      )}

      {/* ── Validation Errors Panel ────────────────────────────────── */}
      {uploadStore.validationErrors.length > 0 && (
        <ValidationErrors
          errors={uploadStore.validationErrors}
          totalRows={uploadStore.totalRows}
        />
      )}

      {/* ── Browse Button ──────────────────────────────────────────── */}
      <Button
        variant="outline"
        color="green"
        onClick={() => openRef.current?.()}
        leftSection={
          <span style={{ fontSize: rem(14) }}>📁</span>
        }
        size="sm"
        style={{ alignSelf: "center" }}
      >
        {uploadStore.file ? "Choose Different File" : "Browse Files"}
      </Button>
    </Stack>
  );
});

export default FileUpload;
