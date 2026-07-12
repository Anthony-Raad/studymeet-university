import { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, Modal } from "react-native";

import { APP_NAME, API_URL } from "../constants";
import getStyles from "../styles";
import { useTheme } from "../ThemeContext";

function PasswordReq(props) {
  const met = props.met;
  const label = props.label;
  const color = met ? "#27ae60" : "#e51f1f";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Text style={{ fontSize: 13, color: color }}>{label}</Text>
    </View>
  );
}

export default function LoginModal(props) {
  const visible = props.visible;
  const onClose = props.onClose;
  const onLogin = props.onLogin;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getStyles(colors);

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(
    function () {
      if (!visible) {
        setEmail("");
        setPassword("");
        setBusy(false);
        setServerError("");
        setMode("login");
      }
    },
    [visible]
  );

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()\-_=+[\]{}|;':",./<>?]/.test(password);
  const passwordIsValid = hasLength && hasUpper && hasSpecial;
  const formIsValid = email.includes("@") && passwordIsValid;

  async function handleSubmit() {
    if (!formIsValid || busy) {
      return;
    }

    setBusy(true);
    setServerError("");

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Something went wrong.");
      } else {
        onLogin(email.trim());
      }
    } catch (err) {
      setServerError("Could not reach the server. Is it running?");
    }

    setBusy(false);
  }

  function toggleMode() {
    if (mode === "login") {
      setMode("register");
    } else {
      setMode("login");
    }
    setServerError("");
  }

  function doNothing() {
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={doNothing}>
          <Text style={styles.cardTitle}>{APP_NAME}</Text>
          <Text style={styles.cardSubtitle}>
            {mode === "login" ? "Log in to your account" : "Create a new account"}
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={function (text) {
              setEmail(text);
              setServerError("");
            }}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={function (text) {
              setPassword(text);
              setServerError("");
            }}
            placeholder="Your password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
          />

          {password.length > 0 && (
            <View style={styles.reqList}>
              <PasswordReq met={hasLength} label="At least 8 characters" />
              <PasswordReq met={hasUpper} label="At least one uppercase letter (A-Z)" />
              <PasswordReq met={hasSpecial} label="At least one special character (like ! or #)" />
            </View>
          )}

          {serverError ? <Text style={styles.authError}>{serverError}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={busy || !formIsValid}
            style={function (state) {
              return [
                styles.joinButton,
                styles.fullWidth,
                (!formIsValid || busy) && { opacity: 0.45 },
                state.pressed && styles.joinButtonPressed,
              ];
            }}
          >
            <Text style={styles.joinButtonText}>
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create Account"}
            </Text>
          </Pressable>

          <Pressable onPress={toggleMode} style={[styles.cancel, { marginTop: 16 }]}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              {mode === "login" ? "No account yet? Create one" : "Already have an account? Log in"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={[styles.cancel, { marginTop: 6 }]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
