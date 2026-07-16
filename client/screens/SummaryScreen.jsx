import { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";

import { API_URL } from "../constants";
import getStyles from "../styles";
import { useTheme } from "../ThemeContext";

export default function SummaryScreen(props) {
  const meetingCode = props.meetingCode;
  const userEmail = props.userEmail;
  const onBack = props.onBack;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getStyles(colors);

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [chatMessages, setChatMessages] = useState([]);
  const [nextChatId, setNextChatId] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(
    function () {
      let cancelled = false;
      let attempts = 0;

      async function fetchSummary() {
        if (cancelled) {
          return;
        }
        attempts = attempts + 1;

        try {
          const response = await fetch(API_URL + "/api/meetings/" + meetingCode + "/summary");

          if (response.status === 404) {
            if (attempts < 20 && !cancelled) {
              setTimeout(fetchSummary, 2000);
            } else if (!cancelled) {
              setError("The class summary isn't ready yet. Check back after the meeting ends.");
              setLoading(false);
            }
            return;
          }

          const data = await response.json();
          if (!cancelled) {
            setSummary(data.summary || "");
            setLoading(false);
          }
        } catch (err) {
          if (!cancelled) {
            setError("Could not load the summary. Make sure the server is running.");
            setLoading(false);
          }
        }
      }

      fetchSummary();

      return function () {
        cancelled = true;
      };
    },
    [meetingCode]
  );

  const rawLines = summary.split("\n");
  const lines = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      lines.push(trimmed);
    }
  }

  function looksLikeBullet(line) {
    if (line.indexOf(".") === 0) return true;
    if (line.indexOf("-") === 0) return true;
    if (line.charCodeAt(0) === 8226) return true;
    if (/^\d+\./.test(line)) return true;
    return false;
  }

  async function sendQuestion() {
    const question = chatInput.trim();
    if (!question) {
      return;
    }
    setChatBusy(true);
    setChatError("");

    try {
      const response = await fetch(API_URL + "/api/meetings/" + meetingCode + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });
      const data = await response.json();

      if (!response.ok) {
        setChatError(data.error || "Could not get an answer.");
        setChatBusy(false);
        return;
      }

      const newMessage = {
        id: nextChatId,
        question: question,
        answer: data.answer || "",
        saved: false,
      };

      const updated = [];
      for (const message of chatMessages) {
        updated.push(message);
      }
      updated.push(newMessage);

      setChatMessages(updated);
      setNextChatId(nextChatId + 1);
      setChatInput("");
    } catch (err) {
      setChatError("Could not reach the server.");
    }

    setChatBusy(false);
  }

  async function saveToNotebook(message) {
    try {
      await fetch(API_URL + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          meetingCode: meetingCode,
          title: message.question,
          content: message.answer,
        }),
      });

      const updated = [];
      for (const existing of chatMessages) {
        if (existing.id === message.id) {
          updated.push({ id: existing.id, question: existing.question, answer: existing.answer, saved: true });
        } else {
          updated.push(existing);
        }
      }
      setChatMessages(updated);
    } catch (err) {
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          Study<Text style={styles.logoAccent}>Meet</Text>
        </Text>
        <Pressable onPress={onBack} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>{"<- Back"}</Text>
        </Pressable>
      </View>

      <View style={[styles.hero, { alignItems: "flex-start" }]}>
        <Text style={styles.summaryBadge}>Session - {meetingCode}</Text>
        <Text style={[styles.title, { textAlign: "left", marginTop: 8 }]}>Class Summary</Text>
        <Text style={[styles.subtitle, { textAlign: "left" }]}>
          What was covered in this session, summarized by AI.
        </Text>
      </View>

      <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
        {loading && (
          <Text style={[styles.featureText, { textAlign: "center", paddingVertical: 24 }]}>
            Generating summary...
          </Text>
        )}
        {!loading && error.length > 0 && <Text style={[styles.status, { color: colors.muted }]}>{error}</Text>}
        {!loading &&
          !error &&
          lines.map(function (line, index) {
            const isBullet = looksLikeBullet(line);
            return (
              <View key={index} style={styles.summaryLine}>
                {isBullet ? (
                  <Text style={styles.summaryText}>{line}</Text>
                ) : (
                  <Text style={styles.summaryHeading}>{line}</Text>
                )}
              </View>
            );
          })}
      </View>

      {!loading && !error && (
        <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
          <Text style={styles.featureTitle}>Ask About This Summary</Text>
          <Text style={[styles.featureText, { marginBottom: 10 }]}>
            Ask a question and get an answer from AI based on this summary.
          </Text>

          {chatMessages.map(function (message) {
            return (
              <View key={message.id} style={styles.chatBubble}>
                <Text style={styles.chatQuestionText}>{message.question}</Text>
                <Text style={styles.chatAnswerText}>{message.answer}</Text>
                <View style={styles.chatButtonsRow}>
                  {message.saved ? (
                    <Text style={styles.savedLabel}>Saved to Notebook</Text>
                  ) : (
                    <Pressable
                      onPress={function () {
                        saveToNotebook(message);
                      }}
                      style={styles.SummaryBtn}
                    >
                      <Text style={styles.SummaryBtnText}>Save to Notebook</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          <View
            style={[
              styles.joinRow,
              { justifyContent: "flex-start", marginTop: chatMessages.length > 0 ? 14 : 0 },
            ]}
          >
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask a question..."
              placeholderTextColor={colors.muted}
              style={[styles.input, { flex: 1 }]}
            />
            <Pressable
              onPress={sendQuestion}
              disabled={chatBusy || !chatInput.trim()}
              style={function (state) {
                return [styles.joinButton, state.pressed && styles.joinButtonPressed];
              }}
            >
              <Text style={styles.joinButtonText}>{chatBusy ? "..." : "Ask"}</Text>
            </Pressable>
          </View>
          {chatError.length > 0 && <Text style={[styles.status, { color: colors.muted }]}>{chatError}</Text>}
        </View>
      )}

      <Pressable
        onPress={onBack}
        style={function (state) {
          return [styles.joinButton, { marginTop: 24, paddingHorizontal: 40 }, state.pressed && styles.joinButtonPressed];
        }}
      >
        <Text style={styles.joinButtonText}>Back to My Classes</Text>
      </Pressable>
    </ScrollView>
  );
}
