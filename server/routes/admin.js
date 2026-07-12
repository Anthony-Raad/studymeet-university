import { Router } from "express";
import { getAllUsers, deleteUser } from "../users.js";
import { getAllClasses, deleteClass } from "../classes.js";
import { getAllMeetings, deleteMeeting } from "../attendance.js";

const router = Router();

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function deleteButtonHtml(action, password) {
  return (
    '<form method="POST" action="' + action + "?pw=" + password + '" style="display:inline" ' +
    'onsubmit="return confirm(\'Are you sure?\')">' +
    '<button class="del">Delete</button>' +
    "</form>"
  );
}

function requireAdmin(req, res, next) {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (req.query.pw === adminPassword) {
    next();
    return;
  }

  res.status(401).send(
    "<!DOCTYPE html>" +
      '<html lang="en">' +
      "<head>" +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      "<title>Admin Login - StudyMeet</title>" +
      "<style>" +
      "* { box-sizing: border-box; margin: 0; padding: 0; }" +
      'body { font-family: -apple-system, sans-serif; background: #F3EFFF; min-height: 100vh; display: flex; align-items: center; justify-content: center; }' +
      ".card { background: #fff; border-radius: 18px; padding: 40px; width: 360px; box-shadow: 0 4px 24px rgba(108,77,246,0.12); }" +
      "h1 { color: #6C4DF6; font-size: 24px; font-weight: 800; margin-bottom: 6px; }" +
      "p { color: #6B6580; font-size: 14px; margin-bottom: 24px; }" +
      "label { font-size: 13px; font-weight: 600; color: #241B45; display: block; margin-bottom: 6px; }" +
      "input { width: 100%; border: 1px solid #E3DCFB; border-radius: 10px; padding: 12px 14px; font-size: 15px; color: #241B45; }" +
      "button { margin-top: 16px; width: 100%; background: #6C4DF6; color: #fff; border: none; border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 700; cursor: pointer; }" +
      "button:hover { background: #5538D6; }" +
      "</style>" +
      "</head>" +
      "<body>" +
      '<div class="card">' +
      '<h1>StudyMeet <span style="color:#6C4DF6">Admin</span></h1>' +
      "<p>Enter the admin password to access the dashboard.</p>" +
      '<form method="GET" action="/admin">' +
      "<label>Password</label>" +
      '<input type="password" name="pw" placeholder="Admin password" autofocus required />' +
      '<button type="submit">Login</button>' +
      "</form>" +
      "</div>" +
      "</body>" +
      "</html>"
  );
}

router.get("/", requireAdmin, async function (req, res) {
  try {
    const users = await getAllUsers();
    const classes = await getAllClasses();
    const meetings = await getAllMeetings();
    const password = req.query.pw;

    let liveCount = 0;
    for (const meeting of meetings) {
      if (meeting.active) {
        liveCount = liveCount + 1;
      }
    }

    let usersTableHtml;
    if (users.length === 0) {
      usersTableHtml = '<p class="empty">No users registered yet.</p>';
    } else {
      let userRows = "";
      for (const user of users) {
        userRows =
          userRows +
          "<tr>" +
          "<td>" + user.email + "</td>" +
          '<td style="color:#6B6580">' + formatDate(user.createdAt) + "</td>" +
          "<td>" + deleteButtonHtml("/admin/users/" + encodeURIComponent(user.email), password) + "</td>" +
          "</tr>";
      }
      usersTableHtml =
        "<table><thead><tr><th>Email</th><th>Registered</th><th></th></tr></thead>" +
        "<tbody>" + userRows + "</tbody></table>";
    }

    let classesTableHtml;
    if (classes.length === 0) {
      classesTableHtml = '<p class="empty">No classes yet.</p>';
    } else {
      let classRows = "";
      for (const cls of classes) {
        const studentCount = cls.students ? cls.students.length : 0;
        classRows =
          classRows +
          "<tr>" +
          '<td style="font-weight:700">' + cls.name + "</td>" +
          "<td>" + cls.teacherEmail + "</td>" +
          '<td><span class="pill pill-purple">' + cls.inviteCode + "</span></td>" +
          "<td>" + studentCount + "</td>" +
          '<td style="color:#6B6580">' + formatDate(cls.createdAt) + "</td>" +
          "<td>" + deleteButtonHtml("/admin/classes/" + encodeURIComponent(cls.id), password) + "</td>" +
          "</tr>";
      }
      classesTableHtml =
        "<table><thead><tr><th>Name</th><th>Teacher</th><th>Invite code</th><th>Students</th><th>Created</th><th></th></tr></thead>" +
        "<tbody>" + classRows + "</tbody></table>";
    }

    let meetingsTableHtml;
    if (meetings.length === 0) {
      meetingsTableHtml = '<p class="empty">No meetings yet.</p>';
    } else {
      let meetingRows = "";
      for (const meeting of meetings) {
        const statusPillClass = meeting.active ? "pill-green" : "pill-red";
        const statusLabel = meeting.active ? "Live" : "Ended";
        const classIdText = meeting.classId || "-";
        meetingRows =
          meetingRows +
          "<tr>" +
          '<td style="font-family:monospace;font-weight:700">' + meeting.code + "</td>" +
          '<td style="color:#6B6580">' + classIdText + "</td>" +
          '<td><span class="pill ' + statusPillClass + '">' + statusLabel + "</span></td>" +
          "<td>" + meeting.attendeeCount + "</td>" +
          '<td style="color:#6B6580">' + formatDate(meeting.createdAt) + "</td>" +
          "<td>" + deleteButtonHtml("/admin/meetings/" + encodeURIComponent(meeting.code), password) + "</td>" +
          "</tr>";
      }
      meetingsTableHtml =
        "<table><thead><tr><th>Code</th><th>Class</th><th>Status</th><th>Attendees</th><th>Date</th><th></th></tr></thead>" +
        "<tbody>" + meetingRows + "</tbody></table>";
    }

    const page =
      "<!DOCTYPE html>" +
      '<html lang="en">' +
      "<head>" +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      "<title>Admin Dashboard - StudyMeet</title>" +
      "<style>" +
      "* { box-sizing: border-box; margin: 0; padding: 0; }" +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #F3EFFF; color: #241B45; min-height: 100vh; }' +
      ".topbar { background: #fff; border-bottom: 1px solid #E3DCFB; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 60px; position: sticky; top: 0; z-index: 10; }" +
      ".logo { font-size: 20px; font-weight: 800; color: #241B45; display: flex; align-items: center; gap: 10px; }" +
      ".logo .wordmark { color: #241B45; white-space: nowrap; }" +
      ".logo .wordmark .meet { color: #6C4DF6; }" +
      ".badge { background: #6C4DF6; color: #fff; font-size: 11px; font-weight: 700; border-radius: 6px; padding: 4px 11px; letter-spacing: 0.06em; }" +
      ".topbar-right { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #6B6580; }" +
      ".btn-logout { background: none; border: 1px solid #E3DCFB; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 700; color: #6B6580; cursor: pointer; text-decoration: none; }" +
      ".btn-logout:hover { border-color: #FF3B30; color: #FF3B30; }" +
      ".page { max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px; }" +
      ".stats { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }" +
      ".stat { background: #fff; border: 1px solid #E3DCFB; border-radius: 14px; padding: 20px 28px; flex: 1; min-width: 160px; }" +
      ".stat-num { font-size: 36px; font-weight: 800; color: #6C4DF6; }" +
      ".stat-label { font-size: 13px; color: #6B6580; margin-top: 4px; }" +
      ".section { background: #fff; border: 1px solid #E3DCFB; border-radius: 16px; padding: 24px; margin-bottom: 24px; }" +
      ".section-title { font-size: 17px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }" +
      ".count { background: #F3EFFF; color: #6C4DF6; font-size: 12px; font-weight: 700; border-radius: 20px; padding: 2px 10px; }" +
      "table { width: 100%; border-collapse: collapse; font-size: 14px; }" +
      "th { text-align: left; font-size: 12px; font-weight: 700; color: #6B6580; text-transform: uppercase; letter-spacing: 0.04em; padding: 0 12px 10px; border-bottom: 1px solid #E3DCFB; }" +
      "td { padding: 12px; border-bottom: 1px solid #F3EFFF; vertical-align: middle; }" +
      "tr:last-child td { border-bottom: none; }" +
      "tr:hover td { background: #FAFAFE; }" +
      ".pill { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 3px 10px; }" +
      ".pill-green  { background: #D1FAE5; color: #065F46; }" +
      ".pill-red    { background: #FEE2E2; color: #991B1B; }" +
      ".pill-purple { background: #EDE9FE; color: #5B21B6; }" +
      ".del { background: none; border: 1px solid #FF3B30; color: #FF3B30; border-radius: 8px; padding: 4px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }" +
      ".del:hover { background: #FF3B30; color: #fff; }" +
      ".empty { color: #6B6580; font-size: 14px; text-align: center; padding: 24px 0; }" +
      "</style>" +
      "</head>" +
      "<body>" +
      '<div class="topbar">' +
      '<div class="logo"><span class="wordmark">Study<span class="meet">Meet</span></span><span class="badge">ADMIN</span></div>' +
      '<div class="topbar-right">' +
      "<span>Logged in as admin</span>" +
      '<a href="/admin?pw=' + password + '" style="color:#6C4DF6;text-decoration:none;font-weight:700;font-size:13px">Refresh</a>' +
      '<a href="/admin" class="btn-logout">Logout</a>' +
      "</div>" +
      "</div>" +
      '<div class="page">' +
      '<div class="stats">' +
      '<div class="stat"><div class="stat-num">' + users.length + '</div><div class="stat-label">Registered users</div></div>' +
      '<div class="stat"><div class="stat-num">' + classes.length + '</div><div class="stat-label">Classes</div></div>' +
      '<div class="stat"><div class="stat-num">' + meetings.length + '</div><div class="stat-label">Meetings total</div></div>' +
      '<div class="stat"><div class="stat-num">' + liveCount + '</div><div class="stat-label">Live now</div></div>' +
      "</div>" +
      '<div class="section">' +
      '<div class="section-title">Users <span class="count">' + users.length + "</span></div>" +
      usersTableHtml +
      "</div>" +
      '<div class="section">' +
      '<div class="section-title">Classes <span class="count">' + classes.length + "</span></div>" +
      classesTableHtml +
      "</div>" +
      '<div class="section">' +
      '<div class="section-title">Meetings <span class="count">' + meetings.length + "</span></div>" +
      meetingsTableHtml +
      "</div>" +
      "</div>" +
      "</body>" +
      "</html>";

    res.send(page);
  } catch (err) {
    res.status(500).send("<p>Error loading dashboard: " + err.message + "</p>");
  }
});

router.post("/users/:email", requireAdmin, async function (req, res) {
  try {
    await deleteUser(decodeURIComponent(req.params.email));
  } catch (err) {
  }
  res.redirect("/admin?pw=" + req.query.pw);
});

router.post("/classes/:id", requireAdmin, async function (req, res) {
  try {
    await deleteClass(decodeURIComponent(req.params.id));
  } catch (err) {
  }
  res.redirect("/admin?pw=" + req.query.pw);
});

router.post("/meetings/:code", requireAdmin, async function (req, res) {
  try {
    await deleteMeeting(decodeURIComponent(req.params.code));
  } catch (err) {
  }
  res.redirect("/admin?pw=" + req.query.pw);
});

export default router;
