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
  Progress,
  Badge,
  Box,
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
        className="border-2 border-dashed border-slate-300 hover:border-green-500 hover:bg-green-50 transition-all duration-150 rounded-md bg-white"
      >
        <Group
          justify="center"
          gap={20}
          mih={200}
          style={{ pointerEvents: "none" }}
          py={40}
        >
          <Dropzone.Accept>
            <div className="text-green-600 text-5xl">✅</div>
          </Dropzone.Accept>
          <Dropzone.Reject>
            <div className="text-red-400 text-5xl">❌</div>
          </Dropzone.Reject>
          <Dropzone.Idle>
            <div className="flex flex-col items-center gap-4">
              {/* Upload icon */}
              <div className="w-16 h-16 rounded-md bg-green-100 border border-green-300 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
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
                <Text size="lg" fw={600}>
                  Drop your CSV file here
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  or{" "}
                  <Text
                    span
                    c="green.8"
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
          <Progress value={100} animated color="green" size="sm" radius="md" />
        </Box>
      )}

      {/* ── Selected File Info ─────────────────────────────────────── */}
      {uploadStore.file && !uploadStore.isLoading && (
        <Box className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
          <Group justify="space-between" align="center">
            <Group gap={10}>
              <div className="w-8 h-8 rounded-md bg-green-100 border border-green-300 flex items-center justify-center">
                <span className="text-xs text-green-700 font-bold">CSV</span>
              </div>
              <div>
                <Text size="sm" fw={500}>
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
                  <Badge color="red" variant="light" size="sm">
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
        <Box className="bg-red-50 border border-red-200 rounded-md p-4">
          <Text size="sm" c="red.8" fw={500}>
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

      {/* Browse button removed as Dropzone is clickable */}
    </Stack>
  );
});

export default FileUpload;
