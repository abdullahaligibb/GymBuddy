import { useState } from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { validateLogin, validateRegistration } from "../services/api";
import type { Login, Registration } from "../types";

type Props = {
  checking: boolean;
  busy: boolean;
  error: string;
  restoreFailed: boolean;
  onRetry: () => void;
  onDemo: () => void;
  onLogin: (input: Login) => void;
  onRegister: (input: Registration) => void;
};

const logo = require("../../assets/logo-gymbuddy.png");

export function AuthScreen({ checking, busy, error, restoreFailed, onRetry, onDemo, onLogin, onRegister }: Props) {
  const [registering, setRegistering] = useState(false);
  const [draft, setDraft] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Registration, string>>>({});
  const fields = [
    ...(registering ? [{ id: "username" as const, label: "Benutzername" }] : []),
    { id: "email" as const, label: "E-Mail" },
    { id: "password" as const, label: "Passwort" },
  ];

  function submit() {
    const result = registering ? validateRegistration(draft) : validateLogin(draft);
    setErrors(result);
    if (Object.values(result).some(Boolean)) return;
    if (registering) onRegister(draft);
    else onLogin({ email: draft.email, password: draft.password });
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <View style={styles.brandRow}>
              <Image source={logo} style={styles.logo} />
              <Text style={styles.brand}>Gym Buddy</Text>
            </View>
            {checking ? <ActivityIndicator color="#7CFF6B" accessibilityLabel="Sitzung wird geprüft" /> : <>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              {restoreFailed ? (
                <Button label="Sitzung erneut prüfen" onPress={onRetry} disabled={busy} />
              ) : <>
                <Text style={styles.heading}>{registering ? "Konto erstellen" : "Anmelden"}</Text>
                {fields.map(({ id, label }) => (
                  <View key={id} style={styles.field}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                      accessibilityLabel={label}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                      keyboardType={id === "email" ? "email-address" : "default"}
                      secureTextEntry={id === "password"}
                      style={styles.input}
                      value={draft[id]}
                      onChangeText={(value) => {
                        setDraft((current) => ({ ...current, [id]: value }));
                        setErrors((current) => ({ ...current, [id]: undefined }));
                      }}
                    />
                    {errors[id] ? <Text accessibilityRole="alert" style={styles.error}>{errors[id]}</Text> : null}
                  </View>
                ))}
                <Button label={busy ? "Bitte warten …" : registering ? "Konto erstellen" : "Anmelden"} onPress={submit} disabled={busy} />
                <Button label={registering ? "Zur Anmeldung" : "Neues Konto erstellen"} secondary disabled={busy} onPress={() => {
                  setRegistering(!registering);
                  setErrors({});
                }} />
                <Button label="Demo öffnen" secondary onPress={onDemo} disabled={busy} />
              </>}
            </>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Button({ label, onPress, disabled, secondary }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}>
    <Text style={[styles.buttonLabel, secondary && styles.secondaryLabel]}>{label}</Text>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0F0E" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: 420, alignSelf: "center", gap: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  logo: { width: 46, height: 46, borderRadius: 8 },
  brand: { color: "#F4F7F5", fontSize: 25, fontWeight: "900" },
  heading: { color: "#F4F7F5", fontSize: 23, fontWeight: "800" },
  field: { gap: 6 },
  label: { color: "#DCE5E1", fontWeight: "700" },
  input: { color: "#F4F7F5", backgroundColor: "#111716", minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: "#44534D", paddingHorizontal: 12 },
  error: { color: "#FF9A9D", lineHeight: 20 },
  button: { minHeight: 46, borderRadius: 8, padding: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#7CFF6B" },
  buttonLabel: { color: "#0B0F0E", fontWeight: "800" },
  secondary: { backgroundColor: "#18201E" },
  secondaryLabel: { color: "#DCE5E1" },
  disabled: { opacity: 0.55 },
});
