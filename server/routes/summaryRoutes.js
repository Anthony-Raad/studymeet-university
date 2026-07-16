import { Router } from "express";
import { saveSummary, loadSummary } from "../summaries.js";
import { GEMINI_API_KEY, geminiSummarize, geminiAnswerQuestion } from "../gemini.js";

const router = Router();

router.post("/:code/summary", async function (req, res) {
  const code = req.params.code;
  const transcript = req.body.transcript;

  if (!transcript || !transcript.trim()) {
    const message =
      "No transcript was captured for this meeting.\n\n" +
      "Make sure your browser microphone is enabled and you speak during the meeting " +
      "so the AI can generate a summary next time.";
    await saveSummary(code, message);
    res.json({ summary: message });
    return;
  }

  if (!GEMINI_API_KEY) {
    const message = "AI summary is disabled because no GEMINI_API_KEY was set in the .env file.";
    await saveSummary(code, message);
    res.json({ summary: message });
    return;
  }

  try {
    const summary = await geminiSummarize(transcript);
    await saveSummary(code, summary);
    res.json({ summary: summary });
  } catch (err) {
    console.error("Gemini error:", err.message);
    const fallback = "AI summary could not be generated for this session. Error: " + err.message;
    await saveSummary(code, fallback);
    res.json({ summary: fallback });
  }
});

router.get("/:code/summary", async function (req, res) {
  try {
    const record = await loadSummary(req.params.code);
    if (!record) {
      res.status(404).json({ error: "No summary yet for this meeting." });
      return;
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:code/chat", async function (req, res) {
  const code = req.params.code;
  const question = req.body.question;

  if (!question || !question.trim()) {
    res.status(400).json({ error: "A question is required." });
    return;
  }

  try {
    const record = await loadSummary(code);
    if (!record) {
      res.status(404).json({ error: "No summary yet for this meeting." });
      return;
    }

    if (!GEMINI_API_KEY) {
      res.json({ answer: "AI chat is disabled because no GEMINI_API_KEY was set in the .env file." });
      return;
    }

    try {
      const answer = await geminiAnswerQuestion(record.summary, question);
      res.json({ answer: answer });
    } catch (err) {
      console.error("Gemini chat error:", err.message);
      res.json({ answer: "Could not get an answer right now. Error: " + err.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
