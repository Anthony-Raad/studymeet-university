import { Router } from "express";
import { getAllClasses } from "../classes.js";
import { getAllSummaries } from "../summaries.js";
import { getAllResponses } from "../responses.js";
import { getSessionsForClass } from "../attendance.js";
import { sendTestEmail } from "../email.js";

const router = Router();

router.get("/database", async function (req, res) {
  const teacherEmail = req.query.email;
  if (!teacherEmail) {
    res.status(400).json({ error: "email query param is required." });
    return;
  }

  try {
    const allClasses = await getAllClasses();
    const summaries = await getAllSummaries();
    const responses = await getAllResponses();

    const classes = [];
    for (const cls of allClasses) {
      if (cls.teacherEmail === teacherEmail) {
        classes.push(cls);
      }
    }

    const responseMap = {};
    for (const response of responses) {
      if (!responseMap[response.meetingCode]) {
        responseMap[response.meetingCode] = {};
      }
      responseMap[response.meetingCode][response.email] = response;
    }

    const attendance = [];
    for (const cls of classes) {
      const sessions = await getSessionsForClass(cls.id);
      const classData = { classId: cls.id, className: cls.name, sessions: [] };

      for (const session of sessions) {
        const meetingResponses = responseMap[session.code] || {};

        const students = [];
        for (const email of cls.students) {
          let status = "missed";
          if (session.attended.indexOf(email) !== -1) {
            status = "attended";
          }
          students.push({
            email: email,
            status: status,
            response: meetingResponses[email] || null,
          });
        }

        classData.sessions.push({ code: session.code, createdAt: session.createdAt, students: students });
      }

      attendance.push(classData);
    }

    res.json({ classes: classes, summaries: summaries, attendance: attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/test-email", async function (req, res) {
  const to = req.query.to;
  if (!to) {
    res.status(400).json({ error: "?to=email required" });
    return;
  }
  try {
    const info = await sendTestEmail(to);
    res.json({ ok: true, info: info });
  } catch (err) {
    console.error("[test-email] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
