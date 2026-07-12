import { createServer } from "http";
import express from "express";
import { initDb } from "./db.js";
import { setupWebSocket } from "./websocket.js";

import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classRoutes.js";
import meetingRoutes from "./routes/meetings.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import checkinRoutes from "./routes/checkin.js";
import databaseRoutes from "./routes/database.js";
import adminRoutes from "./routes/admin.js";
import { getMeetingsByEmail } from "./attendance.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

setupWebSocket(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.get("/", function (req, res) {
  res.send("<h1>StudyMeet server</h1><p>Running.</p>");
});

app.use("/api/auth", authRoutes);
app.use("/api", classRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/meetings", summaryRoutes);
app.use("/respond", checkinRoutes);
app.use("/api", databaseRoutes);
app.use("/admin", adminRoutes);

app.get("/api/students/:email/meetings", async function (req, res) {
  try {
    const meetings = await getMeetingsByEmail(req.params.email);
    res.json({ meetings: meetings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDb()
  .then(function () {
    httpServer.listen(PORT, function () {
      console.log("Backend running at http://localhost:" + PORT);
    });
  })
  .catch(function (err) {
    console.error("Could not connect to MySQL:", err.message);
    process.exit(1);
  });
