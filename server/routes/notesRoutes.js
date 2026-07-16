import { Router } from "express";
import { createNote, getNotesByEmail, deleteNote } from "../notes.js";

const router = Router();

router.get("/:email", async function (req, res) {
  try {
    const notes = await getNotesByEmail(req.params.email);
    res.json({ notes: notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async function (req, res) {
  const email = req.body.email;
  const meetingCode = req.body.meetingCode;
  const title = req.body.title;
  const content = req.body.content;

  if (!email || !title || !content) {
    res.status(400).json({ error: "email, title and content are required." });
    return;
  }

  try {
    const note = await createNote(email, meetingCode, title, content);
    res.json({ note: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async function (req, res) {
  const email = req.query.email;
  if (!email) {
    res.status(400).json({ error: "email query param is required." });
    return;
  }

  try {
    const deleted = await deleteNote(req.params.id, email);
    if (!deleted) {
      res.status(404).json({ error: "Note not found." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
