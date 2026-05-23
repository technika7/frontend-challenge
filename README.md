# TiC MRF Generator

A full-stack web application for generating CMS-compliant **Machine-Readable Files (MRFs)** from health plan claims data, per the Transparency in Coverage Rule (45 CFR §147.210).

---

## ✨ Features

| Feature | Details |
|---|---|
| **CSV Upload** | Drag-and-drop or browse — Mantine Dropzone |
| **Parsing** | Papaparse with header mapping |
| **Validation** | Zod schema (26 fields, type coercion, enum checks) |
| **Review Table** | AG Grid — inline edit, per-row approve/remove, bulk actions |
| **MRF Generation** | Backend Strategy Pattern → CMS allowed-amounts JSON |
| **Public MRF Index** | Browse files by customer without login |
| **Dummy Auth** | Login guard on upload/review pages |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 9

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Start the Backend

```bash
cd backend
npm run dev
```

The API server starts at **http://localhost:8080**

```
🚀 MRF Generation API is running on http://localhost:8080
   Health check: http://localhost:8080/health
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The app opens at **http://localhost:5173**

---

## 🔐 Authentication

The upload and review pages require login. Use the demo credentials:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `password123` |

The MRF Files index (`/mrf`) is publicly accessible without login.

---

## 📋 Usage Workflow

1. **Sign in** at `/login` with the demo credentials
2. **Upload** your CSV file at `/upload` — drag and drop `data/sample.csv`
3. **Review** claims at `/review`:
   - Toggle approval per row, or use **Approve All**
   - Edit any cell inline (click to edit)
   - Remove unwanted rows with the **✕ Remove** button
4. Click **Generate MRF Files** — the backend creates JSON files in `backend/mrf-files/`
5. Browse generated files at `/mrf` (public)

---

## 📂 CSV Format

The expected CSV columns match `data/sample.csv`:

```
Claim ID, Subscriber ID, Member Sequence, Claim Status,
Billed, Allowed, Paid, Payment Status Date, Service Date,
Received Date, Entry Date, Processed Date, Paid Date,
Payment Status, Group Name, Group ID, Division Name,
Division ID, Plan, Plan ID, Place of Service, Claim Type,
Procedure Code, Member Gender, Provider ID, Provider Name
```

---

## 🏗️ Architecture

See [DESIGN.md](./DESIGN.md) for full architecture documentation.

```
frontend/          React + Vite + TypeScript
  src/
    components/    Mantine UI components
    pages/         Route-level page components
    stores/        MobX (single file: appStore.ts)
    services/      API calls (mrfService.ts)
    utils/         Zod schema + CSV mapper

backend/           Hono (Node.js)
  src/
    routes/        Hono route groups
    services/      MRF generator (Strategy Pattern)
    schemas/       Zod validation schemas

mrf-files/         Generated MRF JSON output (auto-created)
data/
  sample.csv       Sample claims data (1000+ rows)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite + TypeScript |
| UI Components | **Mantine v7** |
| Styling | **Tailwind CSS v3** |
| State Management | **MobX + mobx-react-lite** |
| CSV Parsing | **Papaparse** |
| Schema Validation | **Zod** |
| Data Table | **AG Grid Community** |
| Routing | **React Router v6** |
| Backend | **Hono** (Node.js) |
| Design Pattern | **Strategy Pattern** (MRF generation) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/mrf/generate` | Generate MRF files from claims |
| `GET` | `/api/mrf/files` | List all MRF files |
| `GET` | `/api/mrf/files/:customer` | Files for a specific customer |
| `GET` | `/mrf-files/*` | Download MRF JSON files |

---

## 📖 References

- [CMS Allowed Amounts Schema](https://github.com/CMSgov/price-transparency-guide/tree/master/schemas/allowed-amounts)
- [TiC Rule — 45 CFR §147.210](https://www.cms.gov/healthplan-price-transparency)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
