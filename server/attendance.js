import pool from "./db.js";

export async function getRoster() {
  const [rows] = await pool.query("SELECT email, name FROM students ORDER BY name");
  return rows;
}

export async function markJoined(meetingCode, email, classId) {
  if (!classId) {
    classId = null;
  }

  if (classId) {
    await pool.query(
      "UPDATE meetings SET active = 0 WHERE class_id = ? AND code != ?",
      [classId, meetingCode]
    );
  }

  await pool.query(
    "INSERT INTO meetings (code, class_id, active) VALUES (?, ?, 1) " +
      "ON DUPLICATE KEY UPDATE code = code",
    [meetingCode, classId]
  );

  await pool.query(
    "INSERT IGNORE INTO attendance (meeting_code, email) VALUES (?, ?)",
    [meetingCode, email]
  );

  const [rows] = await pool.query(
    "SELECT email FROM attendance WHERE meeting_code = ?",
    [meetingCode]
  );

  const joinedEmails = [];
  for (const row of rows) {
    joinedEmails.push(row.email);
  }

  return { code: meetingCode, joined: joinedEmails };
}

export async function endMeeting(code) {
  await pool.query("UPDATE meetings SET active = 0 WHERE code = ?", [code]);
}

export async function getActiveMeeting(classId) {
  const [rows] = await pool.query(
    "SELECT code FROM meetings WHERE class_id = ? AND active = 1 LIMIT 1",
    [classId]
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0].code;
}

export async function checkMeetingActive(code) {
  const [rows] = await pool.query("SELECT active FROM meetings WHERE code = ?", [code]);
  if (rows.length === 0) {
    return true;
  }
  return Boolean(rows[0].active);
}

function guessNameFromEmail(email) {
  const beforeAt = email.split("@")[0];
  const withSpaces = beforeAt.replace(/[._-]/g, " ");

  const words = withSpaces.split(" ");
  const capitalizedWords = [];
  for (const word of words) {
    if (word.length === 0) {
      continue;
    }
    const firstLetter = word[0].toUpperCase();
    const rest = word.slice(1);
    capitalizedWords.push(firstLetter + rest);
  }

  return capitalizedWords.join(" ");
}

export async function getReport(meetingCode) {
  const [meetingRows] = await pool.query(
    "SELECT class_id FROM meetings WHERE code = ?",
    [meetingCode]
  );

  let classId = null;
  if (meetingRows.length > 0) {
    classId = meetingRows[0].class_id;
  }

  let roster = [];
  if (classId) {
    const [rows] = await pool.query(
      "SELECT email FROM class_students WHERE class_id = ?",
      [classId]
    );
    for (const row of rows) {
      roster.push({ email: row.email, name: guessNameFromEmail(row.email) });
    }
  }

  const [attendedRows] = await pool.query(
    "SELECT email FROM attendance WHERE meeting_code = ?",
    [meetingCode]
  );

  const attendedEmails = new Set();
  for (const row of attendedRows) {
    attendedEmails.add(row.email);
  }

  const attended = [];
  const missed = [];
  for (const student of roster) {
    if (attendedEmails.has(student.email)) {
      attended.push(student);
    } else {
      missed.push(student);
    }
  }

  return { meetingCode: meetingCode, attended: attended, missed: missed };
}

export async function getSessionsForClass(classId) {
  const [meetings] = await pool.query(
    "SELECT code, created_at AS createdAt FROM meetings WHERE class_id = ? ORDER BY created_at DESC",
    [classId]
  );

  if (meetings.length === 0) {
    return [];
  }

  const [classStudentRows] = await pool.query(
    "SELECT email FROM class_students WHERE class_id = ?",
    [classId]
  );
  const classEmails = [];
  for (const row of classStudentRows) {
    classEmails.push(row.email);
  }

  const results = [];
  for (const meeting of meetings) {
    const [attRows] = await pool.query(
      "SELECT email FROM attendance WHERE meeting_code = ?",
      [meeting.code]
    );

    const attendedSet = new Set();
    for (const row of attRows) {
      attendedSet.add(row.email);
    }

    const attended = [];
    const missed = [];
    for (const email of classEmails) {
      if (attendedSet.has(email)) {
        attended.push(email);
      } else {
        missed.push(email);
      }
    }

    results.push({
      code: meeting.code,
      createdAt: meeting.createdAt,
      attended: attended,
      missed: missed,
      attendedCount: attRows.length,
    });
  }

  return results;
}

export async function deleteMeeting(code) {
  const [result] = await pool.query("DELETE FROM meetings WHERE code = ?", [code]);
  return result.affectedRows > 0;
}

export async function getAllMeetings() {
  const [rows] = await pool.query(
    "SELECT m.code, m.class_id AS classId, m.active, m.created_at AS createdAt, " +
      "COUNT(a.email) AS attendeeCount " +
      "FROM meetings m " +
      "LEFT JOIN attendance a ON a.meeting_code = m.code " +
      "GROUP BY m.code " +
      "ORDER BY m.created_at DESC"
  );
  return rows;
}

export async function getMeetingsByEmail(email) {
  const [rows] = await pool.query(
    "SELECT m.code, m.created_at AS createdAt " +
      "FROM attendance a " +
      "JOIN meetings m ON m.code = a.meeting_code " +
      "WHERE a.email = ? " +
      "ORDER BY m.created_at DESC",
    [email]
  );
  return rows;
}
