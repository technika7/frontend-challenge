# Application Design — TiC MRF Generator

## Overview

This application enables health plan administrators to generate **Machine-Readable Files (MRFs)** compliant with the CMS Transparency in Coverage (TiC) Rule (45 CFR §147.210). It provides a full-stack workflow: upload a CSV of claims → validate → approve → generate JSON MRFs → publish publicly.

---

## Overall Application Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  /login      │────▶│  /upload     │────▶│  /review     │────▶│  /mrf        │
│              │     │              │     │              │     │              │
│  Auth guard  │     │  CSV Upload  │     │  AG Grid     │     │  Public file │
│  (dummy)     │     │  Papaparse   │     │  Edit/Approve│     │  listing     │
│              │     │  Zod validate│     │  MRF generate│     │  /mrf/:id    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Directory Structure

```
frontend/src/
  components/
    NavBar.tsx          ← Sticky navigation with auth state
    FileUpload.tsx      ← Mantine Dropzone CSV uploader
    ClaimsTable.tsx     ← AG Grid table with edit/approve/remove
    StatusBadge.tsx     ← Colored badge for claim status
    MrfFileCard.tsx     ← Card for displaying MRF file metadata
    ValidationErrors.tsx← Collapsible Zod validation error panel
    LoginForm.tsx       ← Dummy auth login form

  pages/
    index.tsx           ← Smart redirect (auth → /upload, anon → /mrf)
    login/index.tsx     ← Login page (credentials: admin / password123)
    upload/index.tsx    ← CSV upload step (auth-protected)
    review/index.tsx    ← Claims review & approval step (auth-protected)
    mrf/index.tsx       ← Public MRF file index
    mrf/customer.tsx    ← Public per-customer MRF view (/mrf/:customer)
    error/NotFound.tsx  ← 404 page

  stores/
    appStore.ts         ← Single MobX store for ALL state (see below)

  services/
    mrfService.ts       ← API calls: generateMrfFiles, fetchAllMrfFiles, etc.

  utils/
    csvValidator.ts     ← Zod schema + CSV header mapping + batch validator
    mrfMapper.ts        ← Maps ClaimRow → API payload, defines response types

  layout/
    BasicLayout.tsx     ← Root layout with NavBar + React Router Outlet

  routes.tsx            ← React Router createBrowserRouter config
  App.tsx               ← MantineProvider (light theme) + RouterProvider
  index.css             ← Global styles (Mantine, AG Grid, Tailwind)

backend/src/
  index.ts              ← Hono server entry point (CORS, logger, routes)
  schemas/
    claim.schema.ts     ← Zod schema for backend claim validation
  services/
    mrf-generator.ts    ← Strategy Pattern MRF generator
  routes/
    mrf.routes.ts       ← POST /generate, GET /files, GET /files/:customer

mrf-files/              ← Generated JSON MRF output (auto-created)
  {groupId}/
    {YYYY-MM}.json
```

---

## Components and Their Responsibilities

### `NavBar`
- Sticky top navigation using Mantine `Group`, `Badge`, `Button`
- Reads `authStore.isAuthenticated` to conditionally show protected links
- Shows claim count badge on the Review link
- Logout button clears auth state and redirects to `/login`

### `FileUpload`
- Uses Mantine `Dropzone` (accepts `.csv`, max 50 MB)
- On drop: calls `uploadStore.parseAndValidate(file)`
- Shows progress bar during parse, file info card on success
- Surfaces parse errors and renders `<ValidationErrors />` for Zod row errors

### `ClaimsTable`
- AG Grid Community Edition with 17 columns
- Custom cell renderers: approve toggle, remove button, status badge
- Inline editing on: `billed`, `allowed`, `paid`, `procedureCode`, `providerName`
- Single-click inline row approval (via first column checkbox)
- `onCellValueChanged` syncs edits back to `claimsStore.updateClaimField()`
- Row highlighting: green tint for approved rows via `getRowStyle`
- Bulk "Approve All" / "Clear All" buttons above the grid
- Pagination (20/50/100/200 rows per page), column filters (text + number + date)

### `MrfFileCard`
- Displays file period (formatted as "October 2024"), customer, size, last modified
- Download anchor links to `GET /mrf-files/:customer/:file.json`

### `ValidationErrors`
- Collapsible panel using Mantine `Collapse`
- Shows up to 50 row errors with field-level Zod messages
- Capped at 50 with a "…and N more" indicator

### `LoginForm`
- Calls `authStore.login(username, password)` on submit
- Shows demo credentials hint, loading state, error alert
- On success: `navigate("/upload")`

---

## State Management (MobX — `stores/appStore.ts`)

All state is confined to **one file** with four sub-stores:

### `AuthStore`
| Observable | Purpose |
|---|---|
| `isAuthenticated` | Whether the user is logged in |
| `username` | Display name |
| `loginError` | Error message from failed login |
| `isLoading` | Login request in flight |

**Actions**: `login(username, password)`, `logout()`  
**Persistence**: Auth state is rehydrated from `localStorage` on init.

### `UploadStore`
| Observable | Purpose |
|---|---|
| `file` | Selected File object |
| `rawRows` | Papaparse-parsed rows (all strings) |
| `validationErrors` | Zod errors per row |
| `isLoading` | Parse + validate in progress |
| `parseError` | High-level file error |
| `isSuccess` | Parse succeeded |

**Actions**: `parseAndValidate(file)`, `reset()`  
**Computed**: `totalRows`, `validRowCount`, `errorRowCount`

### `ClaimsStore`
| Observable | Purpose |
|---|---|
| `claims` | Array of `EditableClaim` (ClaimRow + `_id` + `_approved`) |

**Actions**: `loadClaims(rows)`, `updateClaimField(id, field, value)`, `removeClaim(id)`, `toggleApprove(id)`, `approveAll()`, `rejectAll()`, `reset()`  
**Computed**: `approvedClaims`, `pendingClaims`, `totalCount`, `approvedCount`

### `MrfStore`
| Observable | Purpose |
|---|---|
| `isGenerating` | MRF API call in flight |
| `generationResult` | Last successful generation response |
| `generationError` | Last failed generation error |
| `allFiles` | Full file list from GET /api/mrf/files |
| `customerFiles` | Files for selected customer |
| `isFetchingFiles` | File list fetch in progress |

**Actions**: `generateMrf()`, `fetchAllFiles()`, `fetchCustomerFiles(customerId)`  
**Computed**: `uniqueCustomers`

---

## Backend API Interaction

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/mrf/generate` | Validate claims + generate MRF JSON files |
| `GET` | `/api/mrf/files` | List all generated MRF files |
| `GET` | `/api/mrf/files/:customer` | List files for a specific customer |
| `GET` | `/mrf-files/*` | Static file serving (download JSON files) |
| `GET` | `/health` | Health check |

### MRF Generation — Strategy Pattern

The generation logic in `backend/src/services/mrf-generator.ts` uses the **Strategy design pattern** ([reference](https://refactoring.guru/design-patterns/strategy)):

```
MrfGenerationStrategy (interface)
    ├── ProfessionalClaimsStrategy   → handles Claim Type = "Professional"
    └── InstitutionalClaimsStrategy  → handles Claim Type = "Institutional"

MrfGeneratorContext
    ├── Uses both strategies
    ├── Groups claims by (groupId, YYYY-MM of serviceDate)
    ├── Per group: builds provider_references index, runs both strategies
    └── Merges in_network items → writes MrfDocument to disk
```

**Aggregation logic**: Claims are grouped by `(providerId, procedureCode, placeOfService, billingClass)`. The average `allowed` amount is computed per group and becomes the `negotiated_rate` in the CMS schema.

**Output structure** (per CMS allowed-amounts schema):
```json
{
  "reporting_entity_name": "Acme Corporation",
  "plan_id": "ACM001",
  "provider_references": [...],
  "in_network": [
    {
      "billing_code": "s5301",
      "negotiated_rates": [
        {
          "provider_references": [0],
          "negotiated_prices": [{ "negotiated_rate": 2383.32, "billing_class": "professional" }]
        }
      ]
    }
  ]
}
```

Files are stored at `backend/mrf-files/{groupId}/{YYYY-MM}.json`.

---

## Routing and Navigation

| Route | Page | Auth Required |
|---|---|---|
| `/` | Redirect (→ `/upload` or `/mrf`) | — |
| `/login` | LoginPage | No |
| `/upload` | UploadPage | Yes (internal guard) |
| `/review` | ReviewPage | Yes (internal guard) |
| `/mrf` | MrfPublicPage | No |
| `/mrf/:customer` | CustomerMrfPage | No |

Auth protection is implemented inside each page with a `useEffect` that calls `navigate("/login", { replace: true })` when `authStore.isAuthenticated` is false. This keeps the route config clean.

---

## Technology Choices

| Concern | Library | Reason |
|---|---|---|
| UI Components | Mantine v7 | Pre-installed, full component library |
| Styling | Tailwind CSS v3 | Utility-first, pre-configured |
| State | MobX + mobx-react-lite | Observable reactivity, single store file |
| CSV Parsing | Papaparse | Header-aware, streaming, well-tested |
| Schema Validation | Zod | TypeScript-first, coercion-friendly |
| Data Table | AG Grid Community | Full-featured, inline edit, free tier |
| Routing | React Router v6 | Pre-installed |
| Backend Framework | Hono | Lightweight, TypeScript-first, Node.js adapter |
| Backend Validation | Zod (shared schema) | Consistent with frontend validation |
