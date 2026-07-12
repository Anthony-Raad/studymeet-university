import pool from "./db.js";

export async function saveSummary(code, summary) {
  await pool.query(
    "INSERT INTO summaries (meeting_code, summary) " +
      "VALUES (?, ?) " +
      "ON DUPLICATE KEY UPDATE summary = VALUES(summary), saved_at = CURRENT_TIMESTAMP",
    [code, summary]
  );
}

export async function loadSummary(code) {
  const [rows] = await pool.query(
    "SELECT summary, saved_at AS savedAt FROM summaries WHERE meeting_code = ?",
    [code]
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

export async function getAllSummaries() {
  const [rows] = await pool.query(
    "SELECT meeting_code AS meetingCode, summary, saved_at AS savedAt FROM summaries"
  );

  const result = {};
  for (const row of rows) {
    result[row.meetingCode] = { summary: row.summary, savedAt: row.savedAt };
  }
  return result;
}
