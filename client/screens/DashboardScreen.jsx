import { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Modal, Switch } from "react-native";

import { API_URL } from "../constants";
import getStyles from "../styles";
import { useTheme } from "../ThemeContext";

function CreateClassModal(props) {
  const visible = props.visible;
  const onClose = props.onClose;
  const onCreate = props.onCreate;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getStyles(colors);

  const [name, setName] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    function () {
      if (!visible) {
        setName("");
        setEmailsText("");
        setBusy(false);
      }
    },
    [visible]
  );

  async function handleCreate() {
    if (!name.trim()) {
      return;
    }
    setBusy(true);

    const rawParts = emailsText.split(/[\n,]/);
    const studentEmails = [];
    for (const part of rawParts) {
      const trimmed = part.trim();
      if (trimmed.includes("@")) {
        studentEmails.push(trimmed);
      }
    }

    await onCreate(name.trim(), studentEmails);
    setBusy(false);
  }

  function doNothing() {
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={doNothing}>
          <Text style={styles.cardTitle}>Create a Class</Text>
          <Text style={styles.cardSubtitle}>Add your class name and enroll students</Text>

          <Text style={styles.label}>Class Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Mathematics 101"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

        
          <Pressable
            onPress={handleCreate}
            disabled={busy || !name.trim()}
            style={function (state) {
              return [
                styles.joinButton,
                styles.fullWidth,
                (!name.trim() || busy) && { opacity: 0.5 },
                state.pressed && styles.joinButtonPressed,
              ];
            }}
          >
            <Text style={styles.joinButtonText}>{busy ? "Creating..." : "Create Class"}</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable> 
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function HamburgerIcon(props) {
  const color = props.color;
  return (
    <View style={{ width: 20, height: 16, justifyContent: "space-between" }}>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: color }} />
      <View style={{ height: 3, borderRadius: 2, backgroundColor: color }} />
      <View style={{ height: 3, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
}

function AccountMenu(props) {
  const visible = props.visible;
  const onClose = props.onClose;
  const userEmail = props.userEmail;
  const onOpenDatabase = props.onOpenDatabase;
  const onOpenNotebook = props.onOpenNotebook;
  const onLogout = props.onLogout;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const darkMode = themeContext.darkMode;
  const toggleDarkMode = themeContext.toggleDarkMode;
  const styles = getStyles(colors);

  function doNothing() {
  }

  function handleDatabase() {
    onClose();
    onOpenDatabase();
  }

  function handleNotebook() {
    onClose();
    onOpenNotebook();
  }

  function handleLogout() {
    onClose();
    onLogout();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={{ flex: 1, width: "100%", alignItems: "flex-end", paddingTop: 70, paddingRight: 24 }}>
          <Pressable style={[styles.card, { width: 300, padding: 22 }]} onPress={doNothing}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={[styles.featureText, { textAlign: "center", marginTop: 6, marginBottom: 18 }]}>
              {userEmail}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                marginBottom: 16,
              }}
            >
              <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={toggleDarkMode} />
            </View>

            <Pressable onPress={handleNotebook} style={[styles.loginButton, styles.fullWidth, { marginBottom: 10 }]}>
              <Text style={styles.loginButtonText}>My Notebook</Text>
            </Pressable>

            <Pressable onPress={handleDatabase} style={[styles.loginButton, styles.fullWidth, { marginBottom: 10 }]}>
              <Text style={styles.loginButtonText}>Database</Text>
            </Pressable>

            <Pressable onPress={handleLogout} style={[styles.loginButton, styles.fullWidth]}>
              <Text style={styles.loginButtonText}>Log out</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function DashboardScreen(props) {
  const userEmail = props.userEmail;
  const onLogout = props.onLogout;
  const onOpenClass = props.onOpenClass;
  const onOpenDatabase = props.onOpenDatabase;
  const onOpenNotebook = props.onOpenNotebook;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getStyles(colors);

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(function () {
    loadClasses();
  }, []);

  async function loadClasses() {
    setLoading(true);
    try {
      const response = await fetch(API_URL + "/api/users/" + encodeURIComponent(userEmail) + "/classes");
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (err) {
      setClasses([]);
    }
    setLoading(false);
  }

  async function handleCreate(name, studentEmails) {
    try {
      const response = await fetch(API_URL + "/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, teacherEmail: userEmail }),
      });
      const data = await response.json();

      if (studentEmails.length > 0) {
        await fetch(API_URL + "/api/classes/" + data.class.id + "/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: studentEmails }),
        });
      }
    } catch (err) {
    }

    setShowCreate(false);
    loadClasses();
  }

  async function handleJoinClass() {
    if (!inviteInput.trim()) {
      return;
    }
    setJoinBusy(true);
    setJoinError("");

    try {
      const response = await fetch(API_URL + "/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteInput.trim(), email: userEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        setJoinError(data.error || "Code not found.");
      } else {
        setInviteInput("");
        loadClasses();
      }
    } catch (err) {
      setJoinError("Could not reach the server.");
    }

    setJoinBusy(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>
            Study<Text style={styles.logoAccent}>Meet</Text>
          </Text>
          <Pressable
            onPress={function () {
              setMenuOpen(true);
            }}
            style={[styles.loginButton, { paddingHorizontal: 15 }]}
          >
            <HamburgerIcon color={colors.primary} />
          </Pressable>
        </View>

        <View style={[styles.hero, { alignItems: "flex-start" }]}>
          <Text style={styles.title}>My Classes</Text>
          <Text style={[styles.subtitle, { textAlign: "left" }]}>{userEmail}</Text>
          <Pressable
            onPress={function () {
              setShowCreate(true);
            }}
            style={[styles.joinButton, { marginTop: 16 }]}
          >
            <Text style={styles.joinButtonText}>+ Create Class</Text>
          </Pressable>
        </View>

        <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
          <Text style={styles.featureTitle}>Join a Class</Text>
          <Text style={[styles.featureText, { marginBottom: 10 }]}>
            Enter the code your teacher gave you (e.g. anthony#4829)
          </Text>
          <View style={[styles.joinRow, { justifyContent: "flex-start" }]}>
            <TextInput
              value={inviteInput}
              onChangeText={setInviteInput}
              placeholder="teacher#1234"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable
              onPress={handleJoinClass}
              disabled={joinBusy || !inviteInput.trim()}
              style={function (state) {
                return [styles.joinButton, state.pressed && styles.joinButtonPressed];
              }}
            >
              <Text style={styles.joinButtonText}>{joinBusy ? "..." : "Join"}</Text>
            </Pressable>
          </View>
          {joinError ? <Text style={[styles.status, { color: "#c0392b" }]}>{joinError}</Text> : null}
        </View>

        <View style={{ width: "100%", maxWidth: 680, paddingHorizontal: 24 }}>
          {loading && (
            <Text style={[styles.featureText, { textAlign: "center", marginTop: 24 }]}>
              Loading your classes...
            </Text>
          )}

          {!loading && classes.length === 0 && (
            <View style={[styles.lobbyCard, { alignItems: "center", paddingVertical: 40 }]}>
              <Text style={[styles.featureTitle, { textAlign: "center", marginBottom: 8 }]}>
                No classes yet
              </Text>
              <Text style={[styles.featureText, { textAlign: "center" }]}>
                Create a class above, or ask your teacher to add you to their class.
              </Text>
            </View>
          )}

          {classes.map(function (cls) {
            const isTeacher = cls.teacherEmail === userEmail;
            const studentWord = cls.students.length === 1 ? "student" : "students";

            return (
              <Pressable
                key={cls.id}
                onPress={function () {
                  onOpenClass(cls.id);
                }}
                style={function (state) {
                  return [styles.classCard, state.pressed && { opacity: 0.85 }];
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classRole}>
                    {isTeacher ? "Teacher" : "Student"} - {cls.students.length} {studentWord}
                  </Text>
                </View>
                <Text style={styles.classArrow}>{">"}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <CreateClassModal
        visible={showCreate}
        onClose={function () {
          setShowCreate(false);
        }}
        onCreate={handleCreate}
      />

      <AccountMenu
        visible={menuOpen}
        onClose={function () {
          setMenuOpen(false);
        }}
        userEmail={userEmail}
        onOpenDatabase={onOpenDatabase}
        onOpenNotebook={onOpenNotebook}
        onLogout={onLogout}
      />
    </View>
  );
}
