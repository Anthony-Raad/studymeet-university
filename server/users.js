import pool from "./db.js";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  const parts = stored.split(":");
  const salt = parts[0];
  const hash = parts[1];
  const expected = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, 64);
  return timingSafeEqual(expected, derived);
}

export async function registerUser(email, password) {
  const [existingRows] = await pool.query("SELECT email FROM users WHERE email = ?", [email]);
  if (existingRows.length > 0) {
    return { error: "An account with this email already exists. Try logging in." };
  }

  const passwordHash = hashPassword(password);
  await pool.query(
    "INSERT INTO users (email, password_hash) VALUES (?, ?)",
    [email, passwordHash]
  );
  return { ok: true };
}

export async function loginUser(email, password) {
  const [rows] = await pool.query("SELECT password_hash FROM users WHERE email = ?", [email]);

  if (rows.length === 0) {
    return { error: "No account found with this email. Create one below." };
  }

  const passwordIsCorrect = verifyPassword(password, rows[0].password_hash);
  if (passwordIsCorrect === false) {
    return { error: "Incorrect password." };
  }

  return { ok: true };
}

export async function getAllUsers() {
  const [rows] = await pool.query("SELECT email, created_at AS createdAt FROM users");
  return rows;
}

export async function deleteUser(email) {
  const [result] = await pool.query("DELETE FROM users WHERE email = ?", [email]);
  return result.affectedRows > 0;
}
