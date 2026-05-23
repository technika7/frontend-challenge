/**
 * @file login/index.tsx
 * @description Login page for the MRF Generator application.
 *
 * Provides dummy authentication before accessing the upload and review pages.
 * Redirects to /upload if the user is already authenticated.
 */

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Container, Title, Text, Box, Stack } from "@mantine/core";
import { authStore } from "../../stores/appStore";
import LoginForm from "../../components/LoginForm";

const LoginPage = observer(() => {
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (authStore.isAuthenticated) {
      navigate("/upload", { replace: true });
    }
  }, [authStore.isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">

      <div className="flex-1 flex items-center justify-center relative z-10 px-4 py-16">
        <Container size="xs" w="100%">
          <Stack gap={32} align="center">
            {/* ── Logo ────────────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-900/20">
                <span className="text-white font-black text-xl">MRF</span>
              </div>
              <div className="text-center">
                <Title order={2} fw={700}>
                  TiC MRF Generator
                </Title>
                <Text size="sm" c="dimmed" mt={4}>
                  Transparency in Coverage — Allowed Amounts Publication
                </Text>
              </div>
            </div>

            {/* ── Login Card ──────────────────────────────────────────── */}
            <Box
              w="100%"
              p={28}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <Text size="lg" fw={600} mb={20}>
                Sign in to continue
              </Text>
              <LoginForm />
            </Box>

            {/* ── Footer note ─────────────────────────────────────────── */}
            <Text size="xs" c="dimmed" ta="center" maw={340}>
              This portal is for authorized health plan administrators. All data
              is processed in accordance with CMS Transparency in Coverage
              regulations (45 CFR §147.210).
            </Text>
          </Stack>
        </Container>
      </div>
    </div>
  );
});

export default LoginPage;
