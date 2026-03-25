import { Router } from "express";
import { db } from "../db.mjs";

const router = Router();

// ── Fetch on-chain records for a user ────────────────────────────────────────
router.get("/users/:userId/records", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM on_chain_records WHERE user_id = $1 ORDER BY recorded_at DESC",
      [req.params.userId],
    );
    res.json({ records: rows });
  } catch (err) {
    console.error("[Records] Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// ── Upsert an on-chain record ─────────────────────────────────────────────────
router.post("/records", async (req, res) => {
  try {
    const { id, userId, recordType, title, description, tonTxHash } = req.body;

    const { rows } = await db.query(
      `INSERT INTO on_chain_records (id, user_id, record_type, title, description, ton_tx_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET ton_tx_hash = $6
       RETURNING *`,
      [id, userId, recordType, title, description || null, tonTxHash || null],
    );

    res.json({ record: rows[0] });
  } catch (err) {
    console.error("[Records] Upsert error:", err.message);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// ── Record an achievement points claim ───────────────────────────────────────
router.post("/claim-points", async (req, res) => {
  try {
    const { userId, walletAddress, points, level, levelName, tonTxHash } = req.body;
    if (!userId || !points) return res.status(400).json({ error: "userId and points required" });

    const claimId = `claim_${userId}_${Date.now()}`;
    const { rows } = await db.query(
      `INSERT INTO on_chain_records (id, user_id, record_type, title, description, ton_tx_hash)
       VALUES ($1, $2, 'points_claim', $3, $4, $5) RETURNING *`,
      [
        claimId,
        userId,
        `Points Claim: ${points} pts`,
        `Tonic AI | Level ${level} ${levelName} | ${points} achievement points claimed on TON | Wallet: ${walletAddress || "unknown"}`,
        tonTxHash || null,
      ],
    );

    res.json({ success: true, record: rows[0], claimId });
  } catch (err) {
    console.error("[Records] Claim points error:", err.message);
    res.status(500).json({ error: "Failed to save claim" });
  }
});

export default router;
