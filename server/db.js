import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "studymeet",
  waitForConnections: true,
  connectionLimit: 10,
});

export async function initDb() {
  const createStudents = `
    CREATE TABLE IF NOT EXISTS students (
      email VARCHAR(255) PRIMARY KEY,
      name  VARCHAR(255) NOT NULL
    )
  `;

  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      email         VARCHAR(255) PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createClasses = `
    CREATE TABLE IF NOT EXISTS classes (
      id            VARCHAR(10)  PRIMARY KEY,
      name          VARCHAR(255) NOT NULL,
      teacher_email VARCHAR(255) NOT NULL,
      invite_code   VARCHAR(50)  NOT NULL UNIQUE,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createClassStudents = `
    CREATE TABLE IF NOT EXISTS class_students (
      class_id VARCHAR(10)  NOT NULL,
      email    VARCHAR(255) NOT NULL,
      PRIMARY KEY (class_id, email),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    )
  `;

  const createMeetings = `
    CREATE TABLE IF NOT EXISTS meetings (
      code       VARCHAR(10) PRIMARY KEY,
      class_id   VARCHAR(10),
      active     TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
    )
  `;

  const createAttendance = `
    CREATE TABLE IF NOT EXISTS attendance (
      meeting_code VARCHAR(10)  NOT NULL,
      email        VARCHAR(255) NOT NULL,
      PRIMARY KEY (meeting_code, email),
      FOREIGN KEY (meeting_code) REFERENCES meetings(code) ON DELETE CASCADE
    )
  `;

  const createResponses = `
    CREATE TABLE IF NOT EXISTS responses (
      meeting_code   VARCHAR(10)  NOT NULL,
      email          VARCHAR(255) NOT NULL,
      type           VARCHAR(20),
      understood     VARCHAR(50),
      review         TEXT,
      absence_reason TEXT,
      submitted_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (meeting_code, email)
    )
  `;

  const createSummaries = `
    CREATE TABLE IF NOT EXISTS summaries (
      meeting_code VARCHAR(10) PRIMARY KEY,
      summary      TEXT        NOT NULL,
      saved_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createNotes = `
    CREATE TABLE IF NOT EXISTS notes (
      id           VARCHAR(10)  PRIMARY KEY,
      email        VARCHAR(255) NOT NULL,
      meeting_code VARCHAR(10),
      title        VARCHAR(255) NOT NULL,
      content      TEXT         NOT NULL,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_code) REFERENCES meetings(code) ON DELETE SET NULL
    )
  `;

  const allTableStatements = [
    createStudents,
    createUsers,
    createClasses,
    createClassStudents,
    createMeetings,
    createAttendance,
    createResponses,
    createSummaries,
    createNotes,
  ];

  for (const statement of allTableStatements) {
    await pool.query(statement);
  }

  const [countRows] = await pool.query("SELECT COUNT(*) AS count FROM students");
  const studentCount = countRows[0].count;

  if (studentCount === 0) {
    const defaultStudents = [
      ["ava@example.com", "Ava Williams"],
      ["james@example.com", "James Hall"],
      ["isabella@example.com", "Isabella Garcia"],
      ["liam@example.com", "Liam Smith"],
      ["alice@example.com", "Alice Johnson"],
      ["bilal@example.com", "Bilal Hassan"],
      ["carla@example.com", "Carla Mendes"],
      ["david@example.com", "David Kim"],
    ];
    await pool.query("INSERT INTO students (email, name) VALUES ?", [defaultStudents]);
  }

  try {
    await pool.query("ALTER TABLE meetings ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 0");
  } catch (err) {
  }

  console.log("Database tables are ready.");
}

export default pool;
