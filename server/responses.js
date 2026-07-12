import pool from "./db.js";

function formatResponseRow(row) {
  return {
    meetingCode: row.meeting_code,
    email: row.email,
    type: row.type,
    understood: row.understood,
    review: row.review,
    absenceReason: row.absence_reason,
    submittedAt: row.submitted_at,
  };
}

export async function saveResponse(meetingCode, email, fields) {
  const type = fields.type || null;
  const understood = fields.understood || null;
  const review = fields.review || null;
  const absenceReason = fields.absenceReason || null;

  await pool.query(
    "INSERT INTO responses (meeting_code, email, type, understood, review, absence_reason) " +
      "VALUES (?, ?, ?, ?, ?, ?) " +
      "ON DUPLICATE KEY UPDATE " +
      "type = VALUES(type), " +
      "understood = VALUES(understood), " +
      "review = VALUES(review), " +
      "absence_reason = VALUES(absence_reason), " +
      "submitted_at = CURRENT_TIMESTAMP",
    [meetingCode, email, type, understood, review, absenceReason]
  );
}

export async function getResponsesForMeeting(meetingCode) {
  const [rows] = await pool.query(
    "SELECT * FROM responses WHERE meeting_code = ?",
    [meetingCode]
  );

  const formatted = [];
  for (const row of rows) {
    formatted.push(formatResponseRow(row));
  }
  return formatted;
}

export async function getAllResponses() {
  const [rows] = await pool.query("SELECT * FROM responses ORDER BY submitted_at DESC");

  const formatted = [];
  for (const row of rows) {
    formatted.push(formatResponseRow(row));
  }
  return formatted;
}
