import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { loginWithEmail, registerWithEmail } from "../api/auth";
import type { UserDto } from "@amon/shared";
import { colors, spacing } from "../theme";

type Props = {
  onLoggedIn: (user: UserDto) => void;
};

export function LoginScreen({ onLoggedIn }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const user = mode === "login" ? await loginWithEmail(email, password) : await registerWithEmail(email, password, name, role);
      onLoggedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amon</Text>
      <Text style={styles.subtitle}>Skilled Hands, Trusted Work</Text>

      {mode === "register" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleOption, role === "customer" && styles.roleOptionActive]}
              onPress={() => setRole("customer")}
            >
              <Text style={[styles.roleText, role === "customer" && styles.roleTextActive]}>
                I need help with a job
              </Text>
            </Pressable>
            <Pressable
              style={[styles.roleOption, role === "worker" && styles.roleOptionActive]}
              onPress={() => setRole("worker")}
            >
              <Text style={[styles.roleText, role === "worker" && styles.roleTextActive]}>
                I'm a skilled worker
              </Text>
            </Pressable>
          </View>
        </>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.paper} />
        ) : (
          <Text style={styles.buttonText}>{mode === "login" ? "Log in" : "Create account"}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
        <Text style={styles.switchText}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        Phone-number sign-in (OTP) and Google sign-in use the same session exchange as this
        screen — they're wired on the backend already; the native OTP widget just isn't hooked
        up in this scaffold yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.paper,
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.brass,
    textAlign: "center",
    marginBottom: spacing.lg,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.copper,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.paper,
    fontWeight: "700",
    fontSize: 16,
  },
  switchText: {
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    backgroundColor: "#00000030",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  roleOptionActive: {
    backgroundColor: colors.copper,
  },
  roleText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  roleTextActive: {
    color: colors.paper,
  },
  error: {
    color: "#E4756B",
    textAlign: "center",
  },
  note: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: spacing.xl,
    lineHeight: 16,
  },
});
