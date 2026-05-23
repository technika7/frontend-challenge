/**
 * @file routes.tsx
 * @description React Router configuration for the MRF Generator application.
 *
 * Route structure:
 *   /              → RootPage (smart redirect based on auth)
 *   /login         → LoginPage (public)
 *   /upload        → UploadPage (auth-protected internally)
 *   /review        → ReviewPage (auth-protected internally)
 *   /mrf           → MrfPublicPage (public)
 *   /mrf/:customer → CustomerMrfPage (public)
 *
 * Auth protection is handled inside each protected page component via
 * a useEffect redirect — this keeps route definitions clean and decoupled.
 */

import { createBrowserRouter } from "react-router-dom";
import BasicLayout from "./layout/BasicLayout";
import NotFoundPage from "./pages/error/NotFound";
import RootPage from "./pages/index";
import LoginPage from "./pages/login/index";
import UploadPage from "./pages/upload/index";
import ReviewPage from "./pages/review/index";
import MrfPublicPage from "./pages/mrf/index";
import CustomerMrfPage from "./pages/mrf/customer";

const router = createBrowserRouter([
  {
    element: <BasicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: "/",
        element: <RootPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/upload",
        element: <UploadPage />,
      },
      {
        path: "/review",
        element: <ReviewPage />,
      },
      {
        path: "/mrf",
        element: <MrfPublicPage />,
      },
      {
        path: "/mrf/:customer",
        element: <CustomerMrfPage />,
      },
    ],
  },
]);

export default router;
