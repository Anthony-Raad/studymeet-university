import { Router } from "express";
import { registerUser, loginUser } from "../users.js";

const router = Router();

router.post("/register", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const result = await registerUser(email, password);
    if (result.error) {
      res.status(400).json(result);
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const result = await loginUser(email, password);
    if (result.error) {
      res.status(401).json(result);
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
