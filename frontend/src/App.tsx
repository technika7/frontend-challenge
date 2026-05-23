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
 * Custom Mantine theme for a mature, enterprise SaaS aesthetic.
 */
const theme = createTheme({
  /** Primary accent color: A crisp green for high contrast active states */
  primaryColor: "green",
  primaryShade: { light: 7, dark: 6 },

  /** Font stack — Inter is used globally for high legibility */
  fontFamily: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`,

  /** Crisp border radius tokens for a professional look */
  radius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
  },

  /** Component-level default prop overrides */
  components: {
    Button: {
      defaultProps: {
        radius: "md",
        fw: 500, // Medium font weight for buttons
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
      },
    },
    Card: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});

export default function App() {
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
