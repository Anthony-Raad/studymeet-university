import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { API_URL } from "../constants";
import { useTheme } from "../ThemeContext";

const TABS = ["Attendance", "Classes", "Summaries"];

export default function DatabaseScreen(props) {
  const userEmail = props.userEmail;
  const onBack = props.onBack;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getScreenStyles(colors);

  const [activeTab, setActiveTab] = useState("Attendance");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(
    function () {
      async function loadData() {
        try {
          const response = await fetch(API_URL + "/api/database?email=" + encodeURIComponent(userEmail));
          if (!response.ok) {
            throw new Error("Server error: " + response.status);
          }
          const json = await response.json();
          setData(json);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      }
      loadData();
    },
    [userEmail]
  );

  let tabContent = null;
  if (!loading && !error && data) {
    if (activeTab === "Attendance") {
      tabContent = <AttendanceTab attendance={data.attendance || []} styles={styles} />;
    } else if (activeTab === "Classes") {
      tabContent = <ClassesTab classes={data.classes || []} styles={styles} />;
    } else if (activeTab === "Summaries") {
      tabContent = <SummariesTab summaries={data.summaries || {}} styles={styles} />;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          <Text style={{ color: colors.text }}>Study</Text>
          <Text style={{ color: colors.primary }}>Meet</Text>
        </Text>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{"<- Back"}</Text>
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(function (tab) {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={function () {
                setActiveTab(tab);
              }}
              style={styles.tabItem}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab}</Text>
              {isActive && <View style={styles.tabUnderline} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <Text style={styles.statusText}>Loading...</Text>}
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
        {tabContent}
      </ScrollView>
    </View>
  );
}

function AttendanceTab(props) {
  const attendance = props.attendance;
  const styles = props.styles;

  if (attendance.length === 0) {
    return <Text style={styles.emptyText}>No sessions yet. Start a meeting to see attendance here.</Text>;
  }

  return (
    <View>
      {attendance.map(function (cls) {
        return (
          <View key={cls.classId} style={{ marginBottom: 24 }}>
            <Text style={styles.classHeading}>{cls.className}</Text>

            {cls.sessions.length === 0 ? (
              <Text style={styles.emptyText}>No sessions for this class yet.</Text>
            ) : (
              cls.sessions.map(function (session) {
                return (
                  <View key={session.code} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgePrimary}>
                        <Text style={styles.badgePrimaryText}>{session.code}</Text>
                      </View>
                      <Text style={styles.mutedText}>{formatDate(session.createdAt)}</Text>
                    </View>

                    {session.students.length === 0 ? (
                      <Text style={styles.emptyText}>No enrolled students.</Text>
                    ) : (
                      session.students.map(function (student) {
                        const attended = student.status === "attended";
                        const dotStyle = attended ? styles.dotGreen : styles.dotRed;
                        const chipStyle = attended ? styles.chipGreen : styles.chipRed;
                        const chipTextStyle = attended ? styles.chipTextGreen : styles.chipTextRed;
                        const statusLabel = attended ? "Attended" : "Absent";

                        return (
                          <View key={student.email} style={styles.studentRow}>
                            <View style={[styles.statusDot, dotStyle]} />

                            <View style={{ flex: 1 }}>
                              <View style={styles.studentHeader}>
                                <Text style={styles.studentEmail} numberOfLines={1}>
                                  {student.email}
                                </Text>
                                <View style={[styles.chip, chipStyle]}>
                                  <Text style={[styles.chipText, chipTextStyle]}>{statusLabel}</Text>
                                </View>
                              </View>

                              {student.response ? (
                                <View style={styles.responseBox}>
                                  {attended && student.response.understood && (
                                    <Text style={styles.responseField}>
                                      Understood: <Text style={styles.responseValue}>{humanUnderstood(student.response.understood)}</Text>
                                    </Text>
                                  )}
                                  {student.response.review ? (
                                    <Text style={styles.responseReview}>"{student.response.review}"</Text>
                                  ) : null}
                                  {student.response.absenceReason ? (
                                    <Text style={styles.responseField}>
                                      Reason: <Text style={styles.responseValue}>{student.response.absenceReason}</Text>
                                    </Text>
                                  ) : null}
                                  <Text style={styles.responseDate}>Submitted {formatDate(student.response.submittedAt)}</Text>
                                </View>
                              ) : (
                                <Text style={styles.noResponse}>No check-in response yet</Text>
                              )}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                );
              })
            )}
          </View>
        );
      })}
    </View>
  );
}

function humanUnderstood(value) {
  if (value === "yes") return "Yes, understood everything";
  if (value === "mostly") return "Mostly, some questions";
  if (value === "no") return "No, needs more help";
  return value;
}

function ClassesTab(props) {
  const classes = props.classes;
  const styles = props.styles;

  if (classes.length === 0) {
    return <Text style={styles.emptyText}>No classes found.</Text>;
  }

  return (
    <View>
      {classes.map(function (cls) {
        const students = cls.students || [];
        return (
          <View key={cls.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{cls.name}</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{cls.inviteCode}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              Teacher: <Text style={styles.cardValue}>{cls.teacherEmail}</Text>
            </Text>
            {cls.createdAt && (
              <Text style={styles.cardSubtitle}>
                Created: <Text style={styles.cardValue}>{formatDate(cls.createdAt)}</Text>
              </Text>
            )}
            <Text style={[styles.cardSubtitle, { marginTop: 8 }]}>Students:</Text>
            {students.length > 0 ? (
              students.map(function (email) {
                return (
                  <Text key={email} style={styles.bullet}>
                    - {email}
                  </Text>
                );
              })
            ) : (
              <Text style={styles.bullet}>No students yet.</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function SummariesTab(props) {
  const summaries = props.summaries;
  const styles = props.styles;
  const meetingCodes = Object.keys(summaries);

  if (meetingCodes.length === 0) {
    return <Text style={styles.emptyText}>No summaries found.</Text>;
  }

  return (
    <View>
      {meetingCodes.map(function (code) {
        const info = summaries[code];
        return (
          <View key={code} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badgePrimary}>
                <Text style={styles.badgePrimaryText}>{code}</Text>
              </View>
              {info.savedAt && <Text style={styles.mutedText}>{formatDate(info.savedAt)}</Text>}
            </View>
            <Text style={styles.summaryText}>{info.summary}</Text>
          </View>
        );
      })}
    </View>
  );
}

function formatDate(isoDate) {
  try {
    return new Date(isoDate).toLocaleString();
  } catch (err) {
    return isoDate;
  }
}

function getScreenStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.hero },

    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    logo: { fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
    backBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.hero, borderWidth: 1, borderColor: C.border },
    backBtnText: { color: C.primary, fontWeight: "600", fontSize: 14 },

    tabBar: { flexDirection: "row", backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 8 },
    tabItem: { alignItems: "center", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 0, marginRight: 2 },
    tabLabel: { fontSize: 14, fontWeight: "500", color: C.muted, marginBottom: 10 },
    tabLabelActive: { color: C.primary, fontWeight: "700" },
    tabUnderline: { height: 3, width: "100%", backgroundColor: C.primary, borderRadius: 2 },

    content: { padding: 16, paddingBottom: 40 },

    statusText: { textAlign: "center", color: C.muted, marginTop: 40, fontSize: 15 },
    errorText: { textAlign: "center", color: "#C0392B", marginTop: 40, fontSize: 15 },
    emptyText: { textAlign: "center", color: C.muted, marginTop: 16, fontSize: 14 },

    classHeading: { fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 10, marginTop: 4 },

    card: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.05)" },
    cardHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: C.text, flexShrink: 1 },
    cardSubtitle: { fontSize: 14, color: C.muted, marginTop: 4 },
    cardValue: { color: C.text, fontWeight: "500" },

    studentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, flexShrink: 0 },
    dotGreen: { backgroundColor: "#22C55E" },
    dotRed: { backgroundColor: "#EF4444" },
    studentHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
    studentEmail: { fontSize: 14, fontWeight: "600", color: C.text, flexShrink: 1 },

    responseBox: { backgroundColor: C.hero, borderRadius: 8, padding: 10, marginTop: 4 },
    responseField: { fontSize: 13, color: C.muted, marginBottom: 2 },
    responseValue: { color: C.text, fontWeight: "600" },
    responseReview: { fontSize: 13, color: C.text, fontStyle: "italic", marginBottom: 4 },
    responseDate: { fontSize: 11, color: C.muted, marginTop: 4 },
    noResponse: { fontSize: 12, color: C.muted, fontStyle: "italic", marginTop: 2 },

    chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.hero, borderWidth: 1, borderColor: C.border },
    chipText: { fontSize: 11, fontWeight: "600", color: C.primary },
    chipGreen: { backgroundColor: "#E8F8EF", borderColor: "#A8DFC0" },
    chipRed: { backgroundColor: "#FEF0F0", borderColor: "#F5B7B1" },
    chipTextGreen: { color: "#1E7A45" },
    chipTextRed: { color: "#C0392B" },

    badgePrimary: { backgroundColor: C.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
    badgePrimaryText: { color: C.white, fontWeight: "700", fontSize: 13 },

    summaryText: { fontSize: 14, color: C.text, lineHeight: 22, marginTop: 6 },
    mutedText: { fontSize: 12, color: C.muted },

    bullet: { fontSize: 14, color: C.text, marginLeft: 8, marginTop: 3 },
  });
}
