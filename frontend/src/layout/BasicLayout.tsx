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
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#050d05" }}
    >
      {/* Persistent navigation bar across all pages */}
      <NavBar />

      {/* Page content — rendered by React Router */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
