import { Router } from "express";
import {
  markJoined,
  getReport,
  endMeeting,
  checkMeetingActive,
} from "../attendance.js";
import { sendCheckInEmails } from "../email.js";

const router = Router();

router.post("/:code/join", async function (req, res) {
  const code = req.params.code;
  const email = req.body.email;

  if (!email) {
    res.status(400).json({ error: "email is required." });
    return;
  }

  try {
    const isActive = await checkMeetingActive(code);
    if (!isActive) {
      res.status(403).json({ error: "This meeting has already ended." });
      return;
    }
    const meeting = await markJoined(code, email);
    res.json({ message: email + " joined " + code + ".", meeting: meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:code/attendance", async function (req, res) {
  try {
    const report = await getReport(req.params.code);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:code/end", async function (req, res) {
  try {
    await endMeeting(req.params.code);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:code/checkin", async function (req, res) {
  try {
    const report = await getReport(req.params.code);
    const result = await sendCheckInEmails(report);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
