import { useState } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { API_URL } from "./constants";
import getStyles from "./styles";
import { ThemeProvider, useTheme } from "./ThemeContext";

import HomeScreen from "./screens/HomeScreen";
import LoginModal from "./screens/LoginModal";
import DashboardScreen from "./screens/DashboardScreen";
import ClassDetailScreen from "./screens/ClassDetailScreen";
import MeetingRoom from "./screens/MeetingRoom";
import SummaryScreen from "./screens/SummaryScreen";
import DatabaseScreen from "./screens/DatabaseScreen";

function AppShell() {
  const themeContext = useTheme();
  const colors = themeContext.colors;
  const darkMode = themeContext.darkMode;
  const styles = getStyles(colors);

  const [screen, setScreen] = useState("home");
  const [showLogin, setShowLogin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [currentClassId, setCurrentClassId] = useState(null);
  const [meetingStudents, setMeetingStudents] = useState([]);

  function handleLogin(email) {
    setUserEmail(email);
    setShowLogin(false);
    setScreen("dashboard");
  }

  function handleLogout() {
    setUserEmail("");
    setCurrentClassId(null);
    setScreen("home");
  }

  function enterMeeting(code, students) {
    setMeetingCode(code);
    setMeetingStudents(students || []);
    setScreen("meeting");
  }

  async function handleLeave(transcript) {
    fetch(API_URL + "/api/meetings/" + meetingCode + "/end", { method: "POST" }).catch(function () {});

    fetch(API_URL + "/api/meetings/" + meetingCode + "/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: transcript || "" }),
    }).catch(function () {});

    fetch(API_URL + "/api/meetings/" + meetingCode + "/checkin", { method: "POST" }).catch(function () {});

    setScreen("summary");
  }

  function viewSummary(code) {
    setMeetingCode(code);
    setScreen("summary");
  }

  function openClass(classId) {
    setCurrentClassId(classId);
    setScreen("classDetail");
  }

  return (
    <View style={styles.app}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {screen === "home" && (
        <HomeScreen
          onLoginPress={function () {
            setShowLogin(true);
          }}
        />
      )}

      {screen === "dashboard" && (
        <DashboardScreen
          userEmail={userEmail}
          onLogout={handleLogout}
          onOpenClass={openClass}
          onOpenDatabase={function () {
            setScreen("database");
          }}
        />
      )}

      {screen === "classDetail" && (
        <ClassDetailScreen
          classId={currentClassId}
          userEmail={userEmail}
          onBack={function () {
            setScreen("dashboard");
          }}
          onEnterMeeting={enterMeeting}
          onViewSummary={viewSummary}
        />
      )}

      {screen === "meeting" && (
        <MeetingRoom
          meetingCode={meetingCode}
          userEmail={userEmail}
          students={meetingStudents}
          onLeave={handleLeave}
        />
      )}

      {screen === "summary" && (
        <SummaryScreen
          meetingCode={meetingCode}
          onBack={function () {
            if (currentClassId) {
              setScreen("classDetail");
            } else {
              setScreen("dashboard");
            }
          }}
        />
      )}

      {screen === "database" && (
        <DatabaseScreen
          userEmail={userEmail}
          onBack={function () {
            setScreen("dashboard");
          }}
        />
      )}

      <LoginModal
        visible={showLogin}
        onClose={function () {
          setShowLogin(false);
        }}
        onLogin={handleLogin}
      />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
