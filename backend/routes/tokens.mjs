import { Router } from "express";
import { db } from "../db.mjs";
import { TONIC_PER_TASK, TONIC_STREAK_BONUS, TONIC_DAILY_CHALLENGE, DAILY_CHALLENGES } from "../config.mjs";

const router = Router();

// ── Fetch $TONIC balance ──────────────────────────────────────────────────────
router.get("/users/:userId/tokens", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT tonic_tokens FROM users WHERE id = $1", [req.params.userId],
    );
    res.json({
      tokens:   rows[0]?.tonic_tokens ?? 0,
      earnRate: `+${TONIC_PER_TASK} per task, +${TONIC_STREAK_BONUS} streak bonus`,
    });
  } catch (err) {
    console.error("[Tokens] Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch tokens", tokens: 0 });
  }
});

// ── Award $TONIC tokens ───────────────────────────────────────────────────────
router.post("/earn-tokens", async (req, res) => {
  try {
    const { userId, reason, amount } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: "userId and amount required" });

    const { rows } = await db.query(
      "UPDATE users SET tonic_tokens = COALESCE(tonic_tokens, 0) + $1 WHERE id = $2 RETURNING tonic_tokens",
      [amount, userId],
    );

    res.json({
      success: true,
      earned:  amount,
      balance: rows[0]?.tonic_tokens ?? amount,
      reason:  reason || "Task completed",
    });
  } catch (err) {
    console.error("[Tokens] Earn error:", err.message);
    res.status(500).json({ error: "Failed to earn tokens" });
  }
});

// ── Get today's daily challenge ───────────────────────────────────────────────
router.get("/daily-challenge", async (req, res) => {
  try {
    const today      = new Date().toISOString().split("T")[0];
    const dayIndex   = Math.floor(Date.now() / 86_400_000) % DAILY_CHALLENGES.length;
    const challenge  = DAILY_CHALLENGES[dayIndex];
    const { userId } = req.query;

    let done = false;
    if (userId) {
      const { rows } = await db.query(
        "SELECT last_daily_challenge, daily_challenge_done FROM users WHERE id = $1",
        [userId],
      );
      if (rows[0]) {
        const lastDay = rows[0].last_daily_challenge?.toISOString?.()?.split("T")[0];
        done = lastDay === today && rows[0].daily_challenge_done;
      }
    }

    res.json({ challenge: { ...challenge, date: today, done } });
  } catch (err) {
    console.error("[Tokens] Daily challenge fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch challenge" });
  }
});

// ── Complete today's daily challenge ─────────────────────────────────────────
router.post("/daily-challenge/complete", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const today = new Date().toISOString().split("T")[0];
    await db.query(
      `UPDATE users
         SET last_daily_challenge = $1, daily_challenge_done = true,
             tonic_tokens = COALESCE(tonic_tokens, 0) + $2
       WHERE id = $3`,
      [today, TONIC_DAILY_CHALLENGE, userId],
    );

    const { rows } = await db.query("SELECT tonic_tokens FROM users WHERE id = $1", [userId]);
    res.json({ success: true, earned: TONIC_DAILY_CHALLENGE, balance: rows[0]?.tonic_tokens ?? 0 });
  } catch (err) {
    console.error("[Tokens] Daily challenge complete error:", err.message);
    res.status(500).json({ error: "Failed to complete challenge" });
  }
});

export default router;
