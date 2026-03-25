import { Router } from "express";
import { db } from "../db.mjs";
import { MOCK_LEADERS } from "../config.mjs";

const router = Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        u.id,
        u.name,
        u.wallet_address,
        COALESCE(u.tonic_tokens, 0)                                                   AS tonic_tokens,
        COUNT(t.id) FILTER (WHERE t.status = 'completed')                             AS completed_tasks,
        COUNT(t.id)                                                                   AS total_tasks,
        ROUND(
          CASE
            WHEN COUNT(t.id) > 0
            THEN (COUNT(t.id) FILTER (WHERE t.status = 'completed')::float / COUNT(t.id)::float) * 100
            ELSE 0
          END
        )                                                                             AS completion_rate,
        (COUNT(t.id) FILTER (WHERE t.status = 'completed') * 10
          + COALESCE(u.tonic_tokens, 0))                                              AS score
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id
      GROUP BY u.id, u.name, u.wallet_address, u.tonic_tokens
      HAVING COUNT(t.id) > 0
      ORDER BY score DESC
      LIMIT 20
    `);

    const realUsers = rows.map((r) => ({
      ...r,
      completed_tasks: Number(r.completed_tasks),
      total_tasks:     Number(r.total_tasks),
      completion_rate: Number(r.completion_rate),
      score:           Number(r.score),
    }));

    // Real users who beat mock entries displace them; combined list capped at 20
    const realIds   = new Set(realUsers.map((u) => u.id));
    const mockScore = realUsers.length > 0 ? Math.min(...realUsers.map((u) => u.score)) : Infinity;
    const filteredMocks = MOCK_LEADERS.filter((m) => !realIds.has(m.id) && m.score > mockScore);

    const combined = [...filteredMocks, ...realUsers]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({ leaderboard: combined.length > 0 ? combined : MOCK_LEADERS.slice(0, 20) });
  } catch (err) {
    console.error("[Leaderboard] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch leaderboard", leaderboard: MOCK_LEADERS });
  }
});

export default router;
