/**
 * @file NavBar.tsx
 * @description Application navigation bar built with Mantine components.
 *
 * Displays:
 *  - App logo / brand name
 *  - Navigation links (Upload, Review, MRF Files)
 *  - Auth status: username + logout button when authenticated
 */

import { observer } from "mobx-react-lite";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Group,
  Text,
  Button,
  Badge,
  Container,
  Anchor,
  Box,
} from "@mantine/core";
import { authStore, claimsStore } from "../stores/appStore";

interface NavLinkProps {
  to: string;
  label: string;
  isActive: boolean;
}

function NavLink({ to, label, isActive }: NavLinkProps) {
  const navigate = useNavigate();
  return (
    <Anchor
      component="button"
      onClick={() => navigate(to)}
      className={`
        px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150
        ${
          isActive
            ? "bg-green-100 text-green-700 border border-green-300"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
        }
      `}
      underline="never"
    >
      {label}
    </Anchor>
  );
}

const NavBar = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    authStore.logout();
    navigate("/login");
  };

  return (
    <Box
      component="nav"
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm"
    >
      <Container size="xl" py={12}>
        <Group justify="space-between" align="center">
          {/* ── Brand ─────────────────────────────────────────────── */}
          <Group gap={10} style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">MRF</span>
            </div>
            <div>
              <Text fw={700} size="sm" c="slate.9" lh={1.1}>
                TiC MRF
              </Text>
              <Text size="xs" c="dimmed" lh={1.1}>
                Generator
              </Text>
            </div>
          </Group>

          {/* ── Navigation Links ──────────────────────────────────── */}
          {authStore.isAuthenticated && (
            <Group gap={4}>
              <NavLink to="/upload" label="Upload" isActive={isActive("/upload")} />
              <NavLink
                to="/review"
                label={
                  claimsStore.totalCount > 0
                    ? `Review (${claimsStore.totalCount})`
                    : "Review"
                }
                isActive={isActive("/review")}
              />
              <NavLink to="/mrf" label="MRF Files" isActive={isActive("/mrf")} />
            </Group>
          )}

          {!authStore.isAuthenticated && (
            <NavLink to="/mrf" label="MRF Files" isActive={isActive("/mrf")} />
          )}

          {/* ── Auth Section ──────────────────────────────────────── */}
          <Group gap={8}>
            {authStore.isAuthenticated ? (
              <>
                <Badge
                  variant="light"
                  color="green"
                  size="sm"
                  radius="sm"
                  className="hidden sm:flex"
                >
                  {authStore.username}
                </Badge>
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                variant="filled"
                color="green"
                size="xs"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
});

export default NavBar;
