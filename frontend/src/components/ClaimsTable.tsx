/**
 * @file ClaimsTable.tsx
 * @description AG Grid data table for reviewing, editing, removing, and approving claims.
 *
 * Features:
 *  - Displays all validated claims with full column set
 *  - Inline cell editing (amount fields, procedure code, provider name)
 *  - Per-row approve/reject toggle with green/gray row highlighting
 *  - Per-row remove button
 *  - Bulk approve-all / reject-all actions
 *  - Summary stats bar (total, approved, pending)
 *  - Currency formatting for Billed / Allowed / Paid columns
 *  - AG Grid Community Edition (free tier)
 */

import { useCallback, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GridReadyEvent,
  type CellValueChangedEvent,
  type ICellRendererParams,
} from "ag-grid-community";
import { Group, Button, Text, Badge, Tooltip, Box } from "@mantine/core";
import { claimsStore } from "../stores/appStore";
import type { EditableClaim } from "../stores/appStore";
import type { ClaimRow } from "../utils/csvValidator";

// Register all AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// ---------------------------------------------------------------------------
// Currency formatter for numeric columns
// ---------------------------------------------------------------------------
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// Custom Cell Renderers
// ---------------------------------------------------------------------------

/** Approve/reject toggle button cell renderer */
function ApproveToggleRenderer(params: ICellRendererParams<EditableClaim>) {
  const claim = params.data;
  if (!claim) return null;

  return (
    <div className="flex items-center h-full">
      <button
        onClick={() => claimsStore.toggleApprove(claim._id)}
        className={`
          px-2 py-0.5 rounded text-xs font-semibold transition-all duration-200 border
          ${
            claim._approved
              ? "bg-green-900/40 text-green-300 border-green-700/50 hover:bg-green-900/60"
              : "bg-gray-800/60 text-gray-400 border-gray-700/50 hover:bg-gray-700/60"
          }
        `}
      >
        {claim._approved ? "✓ Approved" : "Approve"}
      </button>
    </div>
  );
}

/** Remove row button cell renderer */
function RemoveButtonRenderer(params: ICellRendererParams<EditableClaim>) {
  const claim = params.data;
  if (!claim) return null;

  return (
    <div className="flex items-center h-full">
      <button
        onClick={() => claimsStore.removeClaim(claim._id)}
        className="px-2 py-0.5 rounded text-xs text-red-400 border border-red-800/40 hover:bg-red-950/40 hover:text-red-300 transition-all duration-200"
        title="Remove this claim"
      >
        ✕ Remove
      </button>
    </div>
  );
}

/** Currency value formatter */
function currencyFormatter(params: { value: unknown }): string {
  const num = Number(params.value);
  return isNaN(num) ? String(params.value) : usdFormatter.format(num);
}

/** Status badge renderer */
function ClaimStatusRenderer(params: ICellRendererParams<EditableClaim>) {
  const status = params.value as string;
  const colorMap: Record<string, string> = {
    Payable: "text-green-400 bg-green-900/30 border-green-800/40",
    Denied: "text-red-400 bg-red-900/30 border-red-800/40",
    "Partial Deny": "text-orange-400 bg-orange-900/30 border-orange-800/40",
  };
  const cls = colorMap[status] ?? "text-gray-400 bg-gray-900/30 border-gray-700/40";
  return (
    <div className="flex items-center h-full">
      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
        {status}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

function buildColumnDefs(): ColDef<EditableClaim>[] {
  return [
    // ── Actions ───────────────────────────────────────────────────────────
    {
      headerName: "Approval",
      field: "_approved",
      width: 120,
      pinned: "left",
      sortable: false,
      filter: false,
      cellRenderer: ApproveToggleRenderer,
    },
    {
      headerName: "Remove",
      field: "_id",
      width: 100,
      pinned: "left",
      sortable: false,
      filter: false,
      cellRenderer: RemoveButtonRenderer,
    },

    // ── Claim Identifiers ─────────────────────────────────────────────────
    {
      headerName: "Claim ID",
      field: "claimId",
      width: 160,
      pinned: "left",
      filter: "agTextColumnFilter",
      cellStyle: { fontFamily: "monospace", fontSize: "11px" },
    },
    {
      headerName: "Status",
      field: "claimStatus",
      width: 130,
      filter: "agTextColumnFilter",
      cellRenderer: ClaimStatusRenderer,
    },

    // ── Financial ─────────────────────────────────────────────────────────
    {
      headerName: "Billed",
      field: "billed",
      width: 110,
      editable: true,
      filter: "agNumberColumnFilter",
      valueFormatter: currencyFormatter,
      cellStyle: { textAlign: "right" },
    },
    {
      headerName: "Allowed",
      field: "allowed",
      width: 110,
      editable: true,
      filter: "agNumberColumnFilter",
      valueFormatter: currencyFormatter,
      cellStyle: { textAlign: "right", color: "#86efac" }, // green-300
    },
    {
      headerName: "Paid",
      field: "paid",
      width: 110,
      editable: true,
      filter: "agNumberColumnFilter",
      valueFormatter: currencyFormatter,
      cellStyle: { textAlign: "right" },
    },

    // ── Clinical ──────────────────────────────────────────────────────────
    {
      headerName: "Procedure",
      field: "procedureCode",
      width: 120,
      editable: true,
      filter: "agTextColumnFilter",
      cellStyle: { fontFamily: "monospace" },
    },
    {
      headerName: "Claim Type",
      field: "claimType",
      width: 130,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Place of Service",
      field: "placeOfService",
      width: 180,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Service Date",
      field: "serviceDate",
      width: 130,
      filter: "agDateColumnFilter",
    },

    // ── Provider ──────────────────────────────────────────────────────────
    {
      headerName: "Provider ID",
      field: "providerId",
      width: 120,
      filter: "agTextColumnFilter",
      cellStyle: { fontFamily: "monospace", fontSize: "11px" },
    },
    {
      headerName: "Provider Name",
      field: "providerName",
      width: 200,
      editable: true,
      filter: "agTextColumnFilter",
    },

    // ── Plan / Group ──────────────────────────────────────────────────────
    {
      headerName: "Group",
      field: "groupName",
      width: 160,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Group ID",
      field: "groupId",
      width: 100,
      filter: "agTextColumnFilter",
      cellStyle: { fontFamily: "monospace", fontSize: "11px" },
    },
    {
      headerName: "Plan",
      field: "plan",
      width: 180,
      filter: "agTextColumnFilter",
    },

    // ── Member ────────────────────────────────────────────────────────────
    {
      headerName: "Subscriber ID",
      field: "subscriberId",
      width: 140,
      filter: "agTextColumnFilter",
      cellStyle: { fontFamily: "monospace", fontSize: "11px" },
    },
    {
      headerName: "Gender",
      field: "memberGender",
      width: 90,
      filter: "agTextColumnFilter",
    },
  ];
}

// ---------------------------------------------------------------------------
// Main ClaimsTable Component
// ---------------------------------------------------------------------------

const ClaimsTable = observer(() => {
  const gridRef = useRef<AgGridReact<EditableClaim>>(null);

  const columnDefs = useMemo(() => buildColumnDefs(), []);

  /** AG Grid default column settings */
  const defaultColDef = useMemo<ColDef<EditableClaim>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      suppressHeaderMenuButton: false,
    }),
    []
  );

  /** Row styling: approved = green tint, default = transparent */
  const getRowStyle = useCallback(
    (params: { data?: EditableClaim }) => {
      if (params.data?._approved) {
        return { background: "rgba(0, 69, 2, 0.15)" };
      }
      return {};
    },
    []
  );

  /** Sync AG Grid cell edits back to the MobX store */
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<EditableClaim>) => {
      const { data, colDef, newValue } = event;
      if (!data || !colDef.field) return;
      claimsStore.updateClaimField(
        data._id,
        colDef.field as keyof ClaimRow,
        newValue
      );
    },
    []
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  // AG Grid theme classes
  const gridClass = "ag-theme-quartz-dark";

  if (claimsStore.claims.length === 0) {
    return (
      <Box className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">📋</div>
        <Text size="lg" fw={500} c="dimmed">
          No claims loaded
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          Upload a CSV file to begin reviewing claims
        </Text>
      </Box>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Summary & Actions Bar ──────────────────────────────────── */}
      <Group justify="space-between" align="center" px={4}>
        <Group gap={8}>
          <Badge variant="light" color="blue" size="md">
            {claimsStore.totalCount} Total
          </Badge>
          <Badge variant="light" color="green" size="md">
            {claimsStore.approvedCount} Approved
          </Badge>
          <Badge variant="light" color="gray" size="md">
            {claimsStore.pendingClaims.length} Pending
          </Badge>
        </Group>

        <Group gap={8}>
          <Tooltip label="Approve all loaded claims">
            <Button
              size="xs"
              variant="light"
              color="green"
              onClick={() => claimsStore.approveAll()}
            >
              Approve All
            </Button>
          </Tooltip>
          <Tooltip label="Remove approval from all claims">
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => claimsStore.rejectAll()}
            >
              Clear All
            </Button>
          </Tooltip>
        </Group>
      </Group>

      {/* ── AG Grid Table ──────────────────────────────────────────── */}
      <div className={gridClass} style={{ height: "560px", width: "100%" }}>
        <AgGridReact<EditableClaim>
          ref={gridRef}
          rowData={claimsStore.claims.slice()} // MobX observable → plain array
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          getRowId={(params) => params.data._id}
          onCellValueChanged={onCellValueChanged}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[20, 50, 100, 200]}
          animateRows={true}
          suppressCellFocus={false}
          rowSelection={{ mode: "multiRow" }}
        />
      </div>

      {/* ── Editing Hint ───────────────────────────────────────────── */}
      <Text size="xs" c="dimmed" ta="center">
        💡 Click any highlighted cell to edit • Use the column filters to search
        • Approved rows are highlighted green
      </Text>
    </div>
  );
});

export default ClaimsTable;
