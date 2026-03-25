import { Router } from "express";
import { db } from "../db.mjs";
import { sendTonicReward, isDeployerReady } from "../ton/wallet.mjs";
import { TONIC_PER_TASK } from "../config.mjs";

const router = Router();

// ── Fetch all tasks for a user ───────────────────────────────────────────────
router.get("/users/:userId/tasks", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [req.params.userId],
    );
    res.json({ tasks: rows });
  } catch (err) {
    console.error("[Tasks] Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ── Upsert a single task ─────────────────────────────────────────────────────
router.post("/tasks", async (req, res) => {
  try {
    const {
      id, userId, title, description, category, priority,
      status, dueDate, createdAt, completedAt, aiSuggested,
      stakeAmount, stakeTxHash,
    } = req.body;

    if (!id || !userId || !title) {
      return res.status(400).json({ error: "id, userId, and title are required" });
    }

    const { rows } = await db.query(
      `INSERT INTO tasks
         (id, user_id, title, description, category, priority, status,
          due_date, created_at, completed_at, ai_suggested, stake_amount, stake_tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE
         SET title = $3, description = $4, category = $5, priority = $6,
             status = $7, due_date = $8, completed_at = $10, stake_tx_hash = $13
       RETURNING *`,
      [
        id, userId, title, description || null,
        category || "work", priority || "medium", status || "pending",
        dueDate, createdAt || new Date(), completedAt || null,
        aiSuggested || false, stakeAmount || null, stakeTxHash || null,
      ],
    );

    const savedTask = rows[0];
    res.json({ task: savedTask });

    // Fire on-chain TONIC reward when task is completed (non-blocking)
    if (status === "completed" && savedTask) {
      setImmediate(async () => {
        try {
          if (!isDeployerReady()) return;
          const userRes = await db.query(
            "SELECT wallet_address FROM users WHERE id = $1",
            [userId]
          );
          const walletAddress = userRes.rows[0]?.wallet_address;
          if (!walletAddress) return;
          const result = await sendTonicReward(walletAddress, TONIC_PER_TASK, "task_complete");
          if (result.success && result.txHash) {
            await db.query(
              `INSERT INTO on_chain_records (id, user_id, record_type, title, description, ton_tx_hash)
               VALUES ($1, $2, 'tonic_reward', $3, $4, $5) ON CONFLICT DO NOTHING`,
              [
                `task_${savedTask.id}_${Date.now()}`,
                userId,
                `+${TONIC_PER_TASK} $TONIC — Task Complete`,
                `"${title}" · tx: ${result.txHash.slice(0, 16)}...`,
                result.txHash,
              ]
            );
            console.log(`[TON] On-chain reward sent for task "${title}": ${result.txHash}`);
          }
        } catch (e) {
          console.warn("[TON] On-chain task reward failed:", e.message);
        }
      });
    }
  } catch (err) {
    console.error("[Tasks] Upsert error:", err.message);
    res.status(500).json({ error: "Failed to save task" });
  }
});

// ── Delete a task ────────────────────────────────────────────────────────────
router.delete("/tasks/:taskId", async (req, res) => {
  try {
    await db.query("DELETE FROM tasks WHERE id = $1", [req.params.taskId]);
    res.json({ success: true });
  } catch (err) {
    console.error("[Tasks] Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ── Bulk sync (transactional) ────────────────────────────────────────────────
router.post("/tasks/sync", async (req, res) => {
  const { userId, tasks } = req.body;
  if (!userId || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "userId and tasks array required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks
           (id, user_id, title, description, category, priority, status,
            due_date, created_at, completed_at, ai_suggested, stake_amount, stake_tx_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE
           SET title = $3, description = $4, category = $5, priority = $6,
               status = $7, due_date = $8, completed_at = $10, stake_tx_hash = $13`,
        [
          task.id, userId, task.title, task.description || null,
          task.category, task.priority, task.status,
          task.dueDate, task.createdAt, task.completedAt || null,
          task.aiSuggested || false, task.stakeAmount || null, task.stakeTxHash || null,
        ],
      );
    }

    await client.query("COMMIT");
    res.json({ synced: tasks.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[Tasks] Bulk sync error:", err.message);
    res.status(500).json({ error: "Failed to sync tasks" });
  } finally {
    client.release();
  }
});

export default router;
