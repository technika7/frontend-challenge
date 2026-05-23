/**
 * @file layout/BasicLayout.tsx
 * @description Root layout wrapper that renders the NavBar above all pages.
 *
 * The <Outlet /> is provided by React Router and renders the matched child route.
 * Mantine's @mantine/core styles (including Dropzone) are imported globally in index.css.
 */

import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function BasicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-900">
      {/* Persistent navigation bar across all pages */}
      <NavBar />

      {/* Page content — rendered by React Router */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
