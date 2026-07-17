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

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSavedIndexes, setQuizSavedIndexes] = useState([]);

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

  async function loadQuiz() {
    setQuizLoading(true);
    setQuizError("");
    setQuizAnswers({});
    setQuizSavedIndexes([]);

    try {
      const response = await fetch(API_URL + "/api/meetings/" + meetingCode + "/quiz", {
        method: "POST",
      });
      const data = await response.json();

      if (data.error) {
        setQuizError(data.error);
      }
      setQuizQuestions(data.questions || []);
    } catch (err) {
      setQuizError("Could not reach the server.");
    }

    setQuizLoading(false);
  }

  function pickAnswer(questionIndex, letter) {
    const updated = Object.assign({}, quizAnswers);
    updated[questionIndex] = letter;
    setQuizAnswers(updated);
  }

  async function saveQuestionToNotebook(questionIndex) {
    const question = quizQuestions[questionIndex];
    let correctText = "";
    for (const option of question.options) {
      if (option.letter === question.correct) {
        correctText = option.text;
      }
    }

    try {
      await fetch(API_URL + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          meetingCode: meetingCode,
          title: question.question,
          content: "Correct answer: " + correctText,
        }),
      });

      const updated = [];
      for (const index of quizSavedIndexes) {
        updated.push(index);
      }
      updated.push(questionIndex);
      setQuizSavedIndexes(updated);
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

      {!loading && !error && (
        <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
          <Text style={styles.featureTitle}>Take a Quiz</Text>
          <Text style={[styles.featureText, { marginBottom: 10 }]}>
            Test yourself on what this class covered.
          </Text>

          {quizQuestions.length === 0 && !quizLoading && (
            <Pressable onPress={loadQuiz} style={[styles.joinButton, styles.fullWidth]}>
              <Text style={styles.joinButtonText}>Take a Quiz</Text>
            </Pressable>
          )}

          {quizLoading && <Text style={styles.featureText}>Building your quiz...</Text>}
          {quizError.length > 0 && <Text style={[styles.status, { color: colors.muted }]}>{quizError}</Text>}

          {quizQuestions.map(function (question, index) {
            const pickedLetter = quizAnswers[index];
            const answered = Boolean(pickedLetter);
            const isCorrect = pickedLetter === question.correct;
            const alreadySaved = quizSavedIndexes.indexOf(index) > -1;

            return (
              <View key={index} style={styles.chatBubble}>
                <Text style={styles.chatQuestionText}>
                  {index + 1}. {question.question}
                </Text>

                {question.options.map(function (option) {
                  let optionStyle = styles.quizOption;
                  if (answered && option.letter === question.correct) {
                    optionStyle = styles.quizOptionCorrect;
                  } else if (answered && option.letter === pickedLetter) {
                    optionStyle = styles.quizOptionWrong;
                  }

                  return (
                    <Pressable
                      key={option.letter}
                      onPress={function () {
                        if (!answered) {
                          pickAnswer(index, option.letter);
                        }
                      }}
                      style={optionStyle}
                    >
                      <Text style={styles.quizOptionText}>
                        {option.letter}. {option.text}
                      </Text>
                    </Pressable>
                  );
                })}

                {answered && (
                  <View style={styles.chatButtonsRow}>
                    <Text style={isCorrect ? styles.savedLabel : styles.quizWrongLabel}>
                      {isCorrect ? "Correct!" : "Not quite"}
                    </Text>
                    {!isCorrect && !alreadySaved && (
                      <Pressable
                        onPress={function () {
                          saveQuestionToNotebook(index);
                        }}
                        style={styles.SummaryBtn}
                      >
                        <Text style={styles.SummaryBtnText}>Save to Notebook</Text>
                      </Pressable>
                    )}
                    {!isCorrect && alreadySaved && <Text style={styles.savedLabel}>Saved to Notebook</Text>}
                  </View>
                )}
              </View>
            );
          })}
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
