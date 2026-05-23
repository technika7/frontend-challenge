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
        <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-3">
          <Text size="xs" c="blue.4" fw={500} mb={6}>
            Demo Credentials
          </Text>
          <div className="flex gap-4">
            <div>
              <Text size="xs" c="dimmed">Username</Text>
              <Badge variant="outline" color="blue" size="sm" ff="monospace">
                admin
              </Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed">Password</Text>
              <Badge variant="outline" color="blue" size="sm" ff="monospace">
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
          styles={{
            input: {
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            },
            label: { color: "#9ca3af", marginBottom: 4 },
          }}
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
          styles={{
            input: {
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            },
            label: { color: "#9ca3af", marginBottom: 4 },
          }}
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
            c="green.4"
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
