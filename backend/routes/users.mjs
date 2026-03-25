import { Router } from "express";
import { db } from "../db.mjs";

const router = Router();

// ── Fetch a single user by ID ─────────────────────────────────────────────────
router.get("/users/:userId", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, name, wallet_address, is_guest, tonic_tokens FROM users WHERE id = $1",
      [req.params.userId],
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    const u = rows[0];
    res.json({
      user: {
        id:            u.id,
        name:          u.name,
        walletAddress: u.wallet_address,
        isGuest:       u.is_guest,
        tonicTokens:   u.tonic_tokens || 0,
      },
    });
  } catch (err) {
    console.error("[Users] Fetch by ID error:", err.message);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ── Upsert user profile ───────────────────────────────────────────────────────
router.post("/users", async (req, res) => {
  try {
    const { id, name, walletAddress, isGuest } = req.body;
    if (!id || !name) return res.status(400).json({ error: "id and name are required" });

    const { rows } = await db.query(
      `INSERT INTO users (id, name, wallet_address, is_guest)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
         SET name = $2,
             wallet_address = COALESCE($3, users.wallet_address),
             is_guest = $4,
             updated_at = NOW()
       RETURNING *`,
      [id, name, walletAddress || null, isGuest ?? true],
    );

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("[Users] Upsert error:", err.message);
    res.status(500).json({ error: "Failed to save user" });
  }
});

// ── Store TON wallet proof ────────────────────────────────────────────────────
router.post("/ton-proof", async (req, res) => {
  try {
    const { userId, walletAddress, proof, score } = req.body;
    if (!userId || !walletAddress) {
      return res.status(400).json({ error: "userId and walletAddress required" });
    }

    await db.query(
      `UPDATE users
         SET wallet_address = $2, ton_proof = $3, verified_at = NOW(),
             is_guest = false, updated_at = NOW()
       WHERE id = $1`,
      [userId, walletAddress, proof ? JSON.stringify(proof) : null],
    );

    const { rows } = await db.query(
      `INSERT INTO on_chain_records (id, user_id, record_type, title, description)
       VALUES ($1, $2, 'ton_proof', 'Wallet Verified', $3) RETURNING *`,
      [
        `proof_${userId}_${Date.now()}`,
        userId,
        `Score: ${score || 0} | Wallet: ${walletAddress.slice(0, 12)}...`,
      ],
    );

    res.json({ verified: true, record: rows[0] });
  } catch (err) {
    console.error("[Users] TON proof error:", err.message);
    res.status(500).json({ error: "Failed to store proof" });
  }
});

// ── Generate cross-device sync code ──────────────────────────────────────────
router.post("/sync-code/generate", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const existing = await db.query("SELECT sync_code FROM users WHERE id = $1", [userId]);
    let code = existing.rows[0]?.sync_code;

    if (!code) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await db.query("UPDATE users SET sync_code = $1 WHERE id = $2", [code, userId]);
    }

    res.json({ code, userId });
  } catch (err) {
    console.error("[Users] Sync code generate error:", err.message);
    res.status(500).json({ error: "Failed to generate sync code" });
  }
});

// ── Restore from sync code ────────────────────────────────────────────────────
router.post("/sync-code/restore", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "code required" });

    const userRes = await db.query(
      "SELECT * FROM users WHERE UPPER(sync_code) = UPPER($1)", [code],
    );
    if (!userRes.rows[0]) {
      return res.status(404).json({ error: "Invalid sync code. Check the code and try again." });
    }

    const user     = userRes.rows[0];
    const tasksRes = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC", [user.id],
    );

    res.json({
      user: {
        id:            user.id,
        name:          user.name,
        walletAddress: user.wallet_address,
        tonicTokens:   user.tonic_tokens || 0,
      },
      tasks: tasksRes.rows,
    });
  } catch (err) {
    console.error("[Users] Sync code restore error:", err.message);
    res.status(500).json({ error: "Failed to restore from sync code" });
  }
});

export default router;
