import pool from "./db.js";

function makeId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    id = id + chars[randomIndex];
  }
  return id;
}

export async function createNote(email, meetingCode, title, content) {
  const id = makeId();
  let safeMeetingCode = meetingCode;
  if (!safeMeetingCode) {
    safeMeetingCode = null;
  }

  await pool.query(
    "INSERT INTO notes (id, email, meeting_code, title, content) VALUES (?, ?, ?, ?, ?)",
    [id, email, safeMeetingCode, title, content]
  );

  return {
    id: id,
    email: email,
    meetingCode: safeMeetingCode,
    title: title,
    content: content,
    createdAt: new Date().toISOString(),
    className: null,
  };
}

export async function getNotesByEmail(email) {
  const [rows] = await pool.query(
    "SELECT n.id, n.email, n.meeting_code, n.title, n.content, n.created_at, c.name AS class_name " +
      "FROM notes n " +
      "LEFT JOIN meetings m ON m.code = n.meeting_code " +
      "LEFT JOIN classes c ON c.id = m.class_id " +
      "WHERE n.email = ? " +
      "ORDER BY n.created_at DESC",
    [email]
  );

  const notes = [];
  for (const row of rows) {
    notes.push({
      id: row.id,
      email: row.email,
      meetingCode: row.meeting_code,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      className: row.class_name,
    });
  }
  return notes;
}

export async function deleteNote(id, email) {
  const [result] = await pool.query(
    "DELETE FROM notes WHERE id = ? AND email = ?",
    [id, email]
  );
  return result.affectedRows > 0;
}
