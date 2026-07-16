import { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";

import { API_URL } from "../constants";
import getStyles from "../styles";
import { useTheme } from "../ThemeContext";

export default function NotebookScreen(props) {
  const userEmail = props.userEmail;
  const onBack = props.onBack;

  const themeContext = useTheme();
  const colors = themeContext.colors;
  const styles = getStyles(colors);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(
    function () {
      loadNotes();
    },
    [userEmail]
  );

  async function loadNotes() {
    setLoading(true);
    try {
      const response = await fetch(API_URL + "/api/notes/" + encodeURIComponent(userEmail));
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      setNotes([]);
    }
    setLoading(false);
  }

  async function addNote() {
    if (!title.trim() || !content.trim()) {
      return;
    }
    setBusy(true);
    setStatus("");

    try {
      await fetch(API_URL + "/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      setTitle("");
      setContent("");
    } catch (err) {
      setStatus("Could not save the note. Is the server running?");
    }

    setBusy(false);
    loadNotes();
  }

  async function removeNote(id) {
    try {
      await fetch(API_URL + "/api/notes/" + id + "?email=" + encodeURIComponent(userEmail), {
        method: "DELETE",
      });
    } catch (err) {
    }
    loadNotes();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          Study<Text style={styles.logoAccent}>Meet</Text>
        </Text>
        <Pressable onPress={onBack} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>{"<- Dashboard"}</Text>
        </Pressable>
      </View>

      <View style={[styles.hero, { alignItems: "flex-start" }]}>
        <Text style={styles.title}>My Notebook</Text>
        <Text style={[styles.subtitle, { textAlign: "left" }]}>
          Notes you saved from AI answers, plus anything you wrote yourself.
        </Text>
      </View>

      <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
        <Text style={styles.featureTitle}>Write a Note</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.muted}
          style={[styles.input, { marginTop: 10 }]}
        />
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write your note here..."
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, { height: 90, marginTop: 10, textAlignVertical: "top", paddingTop: 8 }]}
        />
        <Pressable
          onPress={addNote}
          disabled={busy || !title.trim() || !content.trim()}
          style={[styles.joinButton, styles.fullWidth, { marginTop: 10 }]}
        >
          <Text style={styles.joinButtonText}>{busy ? "Saving..." : "Save Note"}</Text>
        </Pressable>
        {status.length > 0 && <Text style={styles.status}>{status}</Text>}
      </View>

      <View style={[styles.lobbyCard, { maxWidth: 680 }]}>
        <Text style={styles.featureTitle}>Your Notes</Text>

        {loading && (
          <Text style={[styles.featureText, { marginTop: 10 }]}>Loading your notes...</Text>
        )}

        {!loading && notes.length === 0 && (
          <Text style={[styles.featureText, { marginTop: 10 }]}>
            No notes yet. Save an answer from a class summary, or write one above.
          </Text>
        )}

        {!loading &&
          notes.map(function (note) {
            const dateLabel = new Date(note.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            let sourceLabel = "Personal note";
            if (note.className) {
              sourceLabel = "From: " + note.className;
            }

            return (
              <View key={note.id} style={styles.noteCard}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteMeta}>{sourceLabel} - {dateLabel}</Text>
                <Text style={styles.noteContent}>{note.content}</Text>
                <Pressable
                  onPress={function () {
                    removeNote(note.id);
                  }}
                  style={{ marginTop: 10, alignSelf: "flex-end" }}
                >
                  <Text style={styles.noteDeleteText}>Delete</Text>
                </Pressable>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}
