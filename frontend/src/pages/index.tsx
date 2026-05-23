/**
 * @file pages/index.tsx
 * @description Root redirect page.
 *
 * Redirects authenticated users to /upload, and unauthenticated users to /mrf
 * (the public MRF index is accessible without login).
 */

import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "../stores/appStore";

const RootPage = observer(() => {
  if (authStore.isAuthenticated) {
    return <Navigate to="/upload" replace />;
  }
  return <Navigate to="/mrf" replace />;
});

export default RootPage;
