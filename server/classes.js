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

function makeInviteCode(teacherEmail) {
  const beforeAt = teacherEmail.split("@")[0];
  const firstPart = beforeAt.split(".")[0].toLowerCase();

  let digits = "";
  for (let i = 0; i < 4; i++) {
    digits = digits + Math.floor(Math.random() * 10);
  }

  return firstPart + "#" + digits;
}

async function attachStudents(cls) {
  if (!cls) {
    return null;
  }

  const [rows] = await pool.query(
    "SELECT email FROM class_students WHERE class_id = ?",
    [cls.id]
  );

  const emails = [];
  for (const row of rows) {
    emails.push(row.email);
  }
  cls.students = emails;

  return cls;
}

function formatClassRow(row) {
  return {
    id: row.id,
    name: row.name,
    teacherEmail: row.teacher_email,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
  };
}

export async function createClass(name, teacherEmail) {
  const id = makeId();
  const inviteCode = makeInviteCode(teacherEmail);

  await pool.query(
    "INSERT INTO classes (id, name, teacher_email, invite_code) VALUES (?, ?, ?, ?)",
    [id, name, teacherEmail, inviteCode]
  );

  return {
    id: id,
    name: name,
    teacherEmail: teacherEmail,
    inviteCode: inviteCode,
    students: [],
    createdAt: new Date().toISOString(),
  };
}

export async function getClass(id) {
  const [rows] = await pool.query("SELECT * FROM classes WHERE id = ?", [id]);
  if (rows.length === 0) {
    return null;
  }

  const cls = formatClassRow(rows[0]);
  return attachStudents(cls);
}

export async function getAllClasses() {
  const [rows] = await pool.query("SELECT * FROM classes ORDER BY created_at DESC");

  const classes = [];
  for (const row of rows) {
    classes.push(formatClassRow(row));
  }

  const withStudents = [];
  for (const cls of classes) {
    withStudents.push(await attachStudents(cls));
  }
  return withStudents;
}

export async function addStudents(id, emails) {
  const [check] = await pool.query("SELECT id FROM classes WHERE id = ?", [id]);
  if (check.length === 0) {
    return null;
  }

  if (emails.length > 0) {
    const rowsToInsert = [];
    for (const email of emails) {
      rowsToInsert.push([id, email]);
    }
    await pool.query(
      "INSERT IGNORE INTO class_students (class_id, email) VALUES ?",
      [rowsToInsert]
    );
  }

  return getClass(id);
}

export async function removeStudent(id, email) {
  const [result] = await pool.query(
    "DELETE FROM class_students WHERE class_id = ? AND email = ?",
    [id, email]
  );
  return result.affectedRows > 0;
}

export async function joinByInviteCode(inviteCode, email) {
  const [rows] = await pool.query(
    "SELECT * FROM classes WHERE LOWER(invite_code) = LOWER(?)",
    [inviteCode.trim()]
  );

  if (rows.length === 0) {
    return null;
  }

  const cls = rows[0];
  await pool.query(
    "INSERT IGNORE INTO class_students (class_id, email) VALUES (?, ?)",
    [cls.id, email]
  );

  return getClass(cls.id);
}

export async function deleteClass(id) {
  const [result] = await pool.query("DELETE FROM classes WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function getClassesByEmail(email) {
  const [rows] = await pool.query(
    "SELECT DISTINCT c.id, c.name, c.teacher_email, c.invite_code, c.created_at " +
      "FROM classes c " +
      "LEFT JOIN class_students cs ON cs.class_id = c.id " +
      "WHERE c.teacher_email = ? OR cs.email = ? " +
      "ORDER BY c.created_at DESC",
    [email, email]
  );

  const classes = [];
  for (const row of rows) {
    classes.push(formatClassRow(row));
  }

  const withStudents = [];
  for (const cls of classes) {
    withStudents.push(await attachStudents(cls));
  }
  return withStudents;
}
