/**
 * @file App.tsx
 * @description Root application component.
 *
 * Wraps the entire app in:
 *  - MantineProvider with a custom dark green theme
 *  - RouterProvider with the React Router config
 */

import { createTheme, MantineProvider } from "@mantine/core";
import { RouterProvider } from "react-router-dom";
import router from "./routes";

/**
 * Custom Mantine theme extending the base dark palette with the brand
 * "royalGreen" color family (matching the TiC / healthcare brand identity).
 */
const theme = createTheme({
  /** Primary color used by buttons, badges, and accents */
  primaryColor: "royalGreen",
  primaryShade: 6,

  /** Font stack — Inter is loaded via Google Fonts in index.css */
  fontFamily: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`,

  /** Border radius tokens for consistent rounding */
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
  },

  /** Custom green palette (10 shades, index 0–9) */
  colors: {
    royalGreen: [
      "#e8fbe8", // 0 — lightest
      "#c3f5c3", // 1
      "#96eb96", // 2
      "#5edb5e", // 3
      "#34c534", // 4
      "#1aaa1a", // 5
      "#00a306", // 6 — primary (used at primaryShade: 6)
      "#007a04", // 7
      "#005c03", // 8
      "#003c02", // 9 — darkest
    ],
  },

  /** Component-level default prop overrides */
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
      },
    },
  },
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
