import { Router } from "express";
import {
  createClass,
  getClass,
  addStudents,
  removeStudent,
  getClassesByEmail,
  joinByInviteCode,
  deleteClass,
} from "../classes.js";
import { markJoined, getActiveMeeting, getSessionsForClass } from "../attendance.js";

const router = Router();

router.get("/users/:email/classes", async function (req, res) {
  try {
    const classes = await getClassesByEmail(req.params.email);
    res.json({ classes: classes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/classes", async function (req, res) {
  const name = req.body.name;
  const teacherEmail = req.body.teacherEmail;

  if (!name || !teacherEmail) {
    res.status(400).json({ error: "name and teacherEmail are required." });
    return;
  }

  try {
    const newClass = await createClass(name, teacherEmail);
    res.json({ class: newClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/classes/join", async function (req, res) {
  const inviteCode = req.body.inviteCode;
  const email = req.body.email;

  if (!inviteCode || !email) {
    res.status(400).json({ error: "inviteCode and email are required." });
    return;
  }

  try {
    const cls = await joinByInviteCode(inviteCode, email);
    if (!cls) {
      res.status(404).json({ error: "Class not found. Double-check the code." });
      return;
    }
    res.json({ class: cls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/classes/:id", async function (req, res) {
  try {
    const cls = await getClass(req.params.id);
    if (!cls) {
      res.status(404).json({ error: "Class not found." });
      return;
    }
    res.json({ class: cls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/classes/:id", async function (req, res) {
  try {
    const removed = await deleteClass(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Class not found." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/classes/:id/students", async function (req, res) {
  try {
    const emails = req.body.emails || [];
    const cls = await addStudents(req.params.id, emails);
    if (!cls) {
      res.status(404).json({ error: "Class not found." });
      return;
    }
    res.json({ class: cls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/classes/:id/students/:email", async function (req, res) {
  try {
    const email = decodeURIComponent(req.params.email);
    const removed = await removeStudent(req.params.id, email);
    if (!removed) {
      res.status(404).json({ error: "Student not found in this class." });
      return;
    }
    const cls = await getClass(req.params.id);
    res.json({ class: cls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/classes/:id/meetings", async function (req, res) {
  const email = req.body.email;
  if (!email) {
    res.status(400).json({ error: "email is required." });
    return;
  }

  try {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code = code + chars[randomIndex];
    }

    await markJoined(code, email, req.params.id);
    res.json({ code: code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/classes/:id/active-meeting", async function (req, res) {
  try {
    const code = await getActiveMeeting(req.params.id);
    res.json({ code: code || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/classes/:id/sessions", async function (req, res) {
  try {
    const sessions = await getSessionsForClass(req.params.id);
    res.json({ sessions: sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
