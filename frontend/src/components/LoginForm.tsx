/**
 * @file LoginForm.tsx
 * @description Dummy authentication login form built with Mantine components.
 *
 * Credentials: admin / password123
 * In a real application this would call an auth API; here it compares against
 * constants in the AuthStore (stores/appStore.ts).
 */

import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Stack,
  Text,
  Anchor,
  Badge,
  Group,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { authStore } from "../stores/appStore";

const LoginForm = observer(() => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await authStore.login(username, password);
    if (success) {
      // Redirect to upload page after successful login
      navigate("/upload");
    }
  };

  return (
    <form onSubmit={handleSubmit} id="login-form">
      <Stack gap={16}>
        {/* ── Demo credentials hint ──────────────────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
          <Group justify="space-between" mb={6}>
            <Text size="xs" c="dimmed" fw={500}>
              Demo Credentials
            </Text>
            <Button 
              size="compact-xs" 
              variant="light" 
              color="green" 
              onClick={() => {
                setUsername("admin");
                setPassword("password123");
              }}
            >
              Auto-fill
            </Button>
          </Group>
          <div className="flex gap-4">
            <div>
              <Text size="xs" c="dimmed">Username</Text>
              <Badge variant="outline" color="green" size="sm" ff="monospace">
                admin
              </Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed">Password</Text>
              <Badge variant="outline" color="green" size="sm" ff="monospace">
                password123
              </Badge>
            </div>
          </div>
        </div>

        {/* ── Error Alert ────────────────────────────────────────────── */}
        {authStore.loginError && (
          <Alert color="red" title="Authentication Failed" radius="md">
            {authStore.loginError}
          </Alert>
        )}

        {/* ── Username ───────────────────────────────────────────────── */}
        <TextInput
          id="login-username"
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
          size="md"
        />

        {/* ── Password ───────────────────────────────────────────────── */}
        <PasswordInput
          id="login-password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
          size="md"
        />

        {/* ── Submit Button ──────────────────────────────────────────── */}
        <Button
          id="login-submit"
          type="submit"
          fullWidth
          size="md"
          color="green"
          loading={authStore.isLoading}
          mt={4}
        >
          Sign In
        </Button>

        {/* ── Public MRF Link ───────────────────────────────────────── */}
        <Text size="xs" c="dimmed" ta="center">
          Want to browse MRF files without signing in?{" "}
          <Anchor
            component="button"
            size="xs"
            c="green.8"
            onClick={() => navigate("/mrf")}
          >
            View Public MRF Index
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
});

export default LoginForm;
