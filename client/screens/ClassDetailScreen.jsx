import { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";

import { API_URL } from "../constants";
import getStyles from "../styles";
import { useTheme } from "../ThemeContext";

export default function ClassDetailScreen(props) {
  const classId = props.classId;
  const userEmail = props.userEmail;
  const onBack = props.onBack;
  const onEnterMeeting = props.onEnterMeeting;
  const onViewSummary = props.onViewSummary;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getStyles(colors);

  const [classData, setClassData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [newEmails, setNewEmails] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);

  const isTeacher = Boolean(classData) && classData.teacherEmail === userEmail;

  useEffect(
    function () {
      loadData();
    },
    [classId]
  );

  useEffect(
    function () {
      if (!classData || classData.teacherEmail === userEmail) {
        return;
      }

      async function checkActive() {
        try {
          const response = await fetch(API_URL + "/api/classes/" + classId + "/active-meeting");
          const data = await response.json();
          setActiveMeeting(data.code || null);
        } catch (err) {
        }
      }

      checkActive();
      const interval = setInterval(checkActive, 5000);
      return function () {
        clearInterval(interval);
      };
    },
    [classData]
  );

  function studentsOrEmptyList() {
    if (classData && classData.students) {
      return classData.students;
    }
    return [];
  }

  async function loadData() {
    setLoading(true);
    try {
      const classResponse = await fetch(API_URL + "/api/classes/" + classId);
      const sessionsResponse = await fetch(API_URL + "/api/classes/" + classId + "/sessions");
      const classJson = await classResponse.json();
      const sessionsJson = await sessionsResponse.json();
      setClassData(classJson.class || null);
      setSessions(sessionsJson.sessions || []);
    } catch (err) {
      setStatus("Could not load class data.");
    }
    setLoading(false);
  }

  async function startMeeting() {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(API_URL + "/api/classes/" + classId + "/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await response.json();
      onEnterMeeting(data.code, studentsOrEmptyList());
    } catch (err) {
      setStatus("Could not start a meeting. Is the server running?");
      setBusy(false);
    }
  }

  async function readErrorMessage(response) {
    try {
      const data = await response.json();
      return data.error;
    } catch (err) {
      return null;
    }
  }

  async function joinMeeting() {
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setStatus("Enter a meeting code first.");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const response = await fetch(API_URL + "/api/meetings/" + cleanCode + "/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        const errorMessage = await readErrorMessage(response);
        setStatus(errorMessage || "Could not join.");
        setBusy(false);
        return;
      }

      onEnterMeeting(cleanCode, studentsOrEmptyList());
    } catch (err) {
      setStatus("Could not join. Is the server running?");
      setBusy(false);
    }
  }

  async function joinActiveMeeting(code) {
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch(API_URL + "/api/meetings/" + code + "/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        const errorMessage = await readErrorMessage(response);
        setActiveMeeting(null);
        setStatus(errorMessage || "Could not join.");
        setBusy(false);
        return;
      }

      onEnterMeeting(code, studentsOrEmptyList());
    } catch (err) {
      setStatus("Could not join. Is the server running?");
      setBusy(false);
    }
  }

  async function handleDelete() {
    try {
      await fetch(API_URL + "/api/classes/" + classId, { method: "DELETE" });
      onBack();
    } catch (err) {
      setStatus("Could not delete the class. Is the server running?");
      setConfirmDelete(false);
    }
  }

  async function addStudents() {
    const rawParts = newEmails.split(/[\n,]/);
    const list = [];
    for (const part of rawParts) {
      const trimmed = part.trim();
      if (trimmed.includes("@")) {
        list.push(trimmed);
      }
    }

    if (list.length === 0) {
      return;
    }

    try {
      await fetch(API_URL + "/api/classes/" + classId + "/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: list }),
      });
    } catch (err) {
    }

    setNewEmails("");
    setEditMode(false);
    loadData();
  }

  async function removeStudent(email) {
    try {
      await fetch(API_URL + "/api/classes/" + classId + "/students/" + encodeURIComponent(email), {
        method: "DELETE",
      });
    } catch (err) {
    }
    loadData();
  }

  let bodyContent = null;

  if (loading) {
    bodyContent = <Text style={[styles.subtitle, { marginTop: 40 }]}>Loading...</Text>;
  } else if (!classData) {
    bodyContent = <Text style={[styles.status, { marginTop: 40 }]}>Class not found.</Text>;
  } else {
    const studentCountLabel = classData.students.length === 1 ? "student" : "students";

    bodyContent = (
      <View style={{ width: "100%", alignItems: "center" }}>
        <View style={[styles.hero, { alignItems: "flex-start" }]}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Text style={styles.summaryBadge}>{isTeacher ? "Teacher" : "Student"}</Text>
            {classData.inviteCode && (
              <Text style={[styles.summaryBadge, { backgroundColor: colors.primaryDark }]}>
                Invite code: {classData.inviteCode}
              </Text>
            )}
          </View>
          <Text style={[styles.title, { textAlign: "left", marginTop: 8 }]}>{classData.name}</Text>
          <Text style={[styles.subtitle, { textAlign: "left" }]}>
            {classData.students.length} {studentCountLabel} enrolled
          </Text>

          {isTeacher && (
            <Pressable
              onPress={startMeeting}
              disabled={busy}
              style={function (state) {
                return [styles.joinButton, { marginTop: 16 }, state.pressed && styles.joinButtonPressed];
              }}
            >
              <Text style={styles.joinButtonText}>Start Meeting</Text>
            </Pressable>
          )}

          {!isTeacher && activeMeeting && (
            <View style={styles.liveBanner}>
              <Text style={styles.liveBannerTitle}>Live Meeting in Progress</Text>
              <Text style={styles.liveBannerSub}>Your teacher started a meeting. Join now!</Text>
              <Pressable
                onPress={function () {
                  joinActiveMeeting(activeMeeting);
                }}
                disabled={busy}
                style={function (state) {
                  return [styles.liveBannerBtn, state.pressed && { opacity: 0.85 }];
                }}
              >
                <Text style={styles.liveBannerBtnText}>{busy ? "Joining..." : "Join Meeting"}</Text>
              </Pressable>
            </View>
          )}

          {!isTeacher && !activeMeeting && (
            <View style={[styles.joinRow, { justifyContent: "flex-start", marginTop: 16 }]}>
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="Meeting code"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                style={styles.input}
              />
              <Pressable
                onPress={joinMeeting}
                disabled={busy}
                style={function (state) {
                  return [styles.joinButton, state.pressed && styles.joinButtonPressed];
                }}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </Pressable>
            </View>
          )}

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>

        {isTeacher && (
          <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.featureTitle}>Students ({classData.students.length})</Text>
              <Pressable
                onPress={function () {
                  setEditMode(!editMode);
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                  {editMode ? "Done" : "Edit"}
                </Text>
              </Pressable>
            </View>

            {editMode && (
              <View>
                <TextInput
                  value={newEmails}
                  onChangeText={setNewEmails}
                  placeholder={"alice@example.com\nbob@example.com"}
                  placeholderTextColor={colors.muted}
                  multiline
                  style={[styles.input, { height: 80, marginTop: 10, textAlignVertical: "top", paddingTop: 8 }]}
                />
                <Pressable onPress={addStudents} style={[styles.joinButton, styles.fullWidth, { marginTop: 8 }]}>
                  <Text style={styles.joinButtonText}>Add Students</Text>
                </Pressable>
              </View>
            )}

            {classData.students.length === 0 ? (
              <Text style={[styles.featureText, { marginTop: 10 }]}>
                No students yet. Tap "Edit" to enroll them.
              </Text>
            ) : (
              classData.students.map(function (email) {
                return (
                  <View
                    key={email}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 4,
                    }}
                  >
                    <Text style={styles.attItem}>- {email}</Text>
                    {editMode && (
                      <Pressable
                        onPress={function () {
                          removeStudent(email);
                        }}
                      >
                        <Text style={{ color: "#FF3B30", fontWeight: "700", fontSize: 13 }}>Remove</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {isTeacher && (
          <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
            {!confirmDelete ? (
              <Pressable
                onPress={function () {
                  setConfirmDelete(true);
                }}
                style={function (state) {
                  return [
                    styles.joinButton,
                    styles.fullWidth,
                    { backgroundColor: "#FF3B30" },
                    state.pressed && { opacity: 0.8 },
                  ];
                }}
              >
                <Text style={styles.joinButtonText}>Delete Class</Text>
              </Pressable>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={[styles.featureTitle, { color: "#FF3B30", textAlign: "center" }]}>
                  Are you sure? This cannot be undone.
                </Text>
                <Pressable
                  onPress={handleDelete}
                  style={[styles.joinButton, styles.fullWidth, { backgroundColor: "#FF3B30" }]}
                >
                  <Text style={styles.joinButtonText}>Yes, delete this class</Text>
                </Pressable>
                <Pressable
                  onPress={function () {
                    setConfirmDelete(false);
                  }}
                  style={styles.cancel}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
          <Text style={styles.featureTitle}>Past Sessions</Text>
          {sessions.length === 0 ? (
            <Text style={[styles.featureText, { marginTop: 10 }]}>
              {isTeacher
                ? "Start a meeting above, it will appear here when it ends."
                : "No sessions yet. Your teacher hasn't run a meeting for this class."}
            </Text>
          ) : (
            sessions.map(function (session) {
              const date = new Date(session.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const attended = session.attended || [];
              const missed = session.missed || [];

              return (
                <View key={session.code} style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionCode}>Session - {session.code}</Text>
                    <Text style={styles.sessionDate}>{date}</Text>
                    {attended.length > 0 && (
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.sessionAttended}>Attended ({attended.length})</Text>
                        {attended.map(function (email) {
                          return (
                            <Text key={email} style={styles.sessionEmail}>
                              - {email}
                            </Text>
                          );
                        })}
                      </View>
                    )}
                    {missed.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={styles.sessionMissed}>Absent ({missed.length})</Text>
                        {missed.map(function (email) {
                          return (
                            <Text key={email} style={styles.sessionEmail}>
                              - {email}
                            </Text>
                          );
                        })}
                      </View>
                    )}
                    {attended.length === 0 && missed.length === 0 && (
                      <Text style={[styles.featureText, { marginTop: 4 }]}>No enrolled students yet.</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={function () {
                      onViewSummary(session.code);
                    }}
                    style={function (state) {
                      return [styles.SummaryBtn, state.pressed && { opacity: 0.75 }];
                    }}
                  >
                    <Text style={styles.SummaryBtnText}>Summary</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          Study<Text style={styles.logoAccent}>Meet</Text>
        </Text>
        <Pressable onPress={onBack} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>{"<- My Classes"}</Text>
        </Pressable>
      </View>

      {bodyContent}
    </ScrollView>
  );
}
