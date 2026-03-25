/**
 * TON Blockchain API Routes
 *
 * GET  /api/ton/deployer         — deployer wallet status + address
 * GET  /api/ton/balance/:address — real TON balance for any wallet
 * POST /api/ton/reward           — send on-chain TONIC reward (achievement/task)
 * GET  /api/ton/history/:userId  — on-chain tx history for user
 */

import { Router } from "express";
import { db } from "../db.mjs";
import { getAddressBalance, getTransactions } from "../ton/client.mjs";
import { sendTonicReward, getDeployerInfo, isDeployerReady } from "../ton/wallet.mjs";

const router = Router();

// ── Deployer status ───────────────────────────────────────────────────────────
router.get("/ton/deployer", async (req, res) => {
  try {
    const info = await getDeployerInfo();
    res.json({
      address:    info.address,
      balanceTon: info.balanceTon,
      ready:      info.ready,
      faucetUrl:  "https://t.me/testgiver_ton_bot",
      explorerUrl: info.address
        ? `https://testnet.tonscan.org/address/${info.address}`
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Real TON balance for any wallet address ───────────────────────────────────
router.get("/ton/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address || address.length < 10) {
      return res.status(400).json({ error: "Invalid address" });
    }
    const nanoton   = await getAddressBalance(address);
    const balanceTon = (Number(nanoton) / 1e9).toFixed(4);
    res.json({
      address,
      nanoton,
      balanceTon,
      explorerUrl: `https://testnet.tonscan.org/address/${address}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send on-chain TONIC reward ────────────────────────────────────────────────
router.post("/ton/reward", async (req, res) => {
  try {
    const { userId, walletAddress, tonicAmount, reason } = req.body;
    if (!userId || !walletAddress || !tonicAmount) {
      return res.status(400).json({ error: "userId, walletAddress, tonicAmount required" });
    }

    if (!isDeployerReady()) {
      return res.json({
        success: false,
        onChain: false,
        message: "On-chain rewards pending wallet funding — TONIC recorded off-chain",
      });
    }

    const result = await sendTonicReward(walletAddress, tonicAmount, reason || "reward");

    if (result.success && result.txHash) {
      // Store tx hash in on_chain_records
      await db.query(
        `INSERT INTO on_chain_records (id, user_id, record_type, title, description, ton_tx_hash)
         VALUES ($1, $2, 'tonic_reward', $3, $4, $5)`,
        [
          `tonic_${userId}_${Date.now()}`,
          userId,
          `$TONIC Reward: +${tonicAmount}`,
          `${tonicAmount} $TONIC earned via ${reason} | tx: ${result.txHash.slice(0, 12)}...`,
          result.txHash,
        ]
      );
    }

    res.json({
      success:     result.success,
      onChain:     result.success,
      txHash:      result.txHash || null,
      explorerUrl: result.explorerUrl || null,
      comment:     result.comment || null,
      error:       result.error || null,
    });
  } catch (err) {
    console.error("[TON] Reward route error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── On-chain tx history for user ─────────────────────────────────────────────
router.get("/ton/history/:userId", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, record_type, title, description, ton_tx_hash, recorded_at
       FROM on_chain_records
       WHERE user_id = $1 AND ton_tx_hash IS NOT NULL
       ORDER BY recorded_at DESC
       LIMIT 20`,
      [req.params.userId]
    );

    res.json({
      records: rows.map((r) => ({
        id:          r.id,
        type:        r.record_type,
        title:       r.title,
        description: r.description,
        txHash:      r.ton_tx_hash,
        explorerUrl: `https://testnet.tonscan.org/tx/${r.ton_tx_hash}`,
        recordedAt:  r.recorded_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
