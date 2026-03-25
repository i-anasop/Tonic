/**
 * TON Deployer Wallet — manages the Tonic AI deployer wallet on testnet.
 *
 * On first boot, if TON_DEPLOYER_MNEMONIC is not set, a new wallet is generated
 * and the mnemonic is logged. Set it as a secret and fund the address via
 * https://t.me/testgiver_ton_bot to enable on-chain TONIC reward transactions.
 */

import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { WalletContractV4, internal, beginCell, toNano, Cell } from "@ton/ton";
import { getAddressBalance, sendBoc } from "./client.mjs";
import { TonClient } from "@ton/ton";

const TESTNET_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";

let _client   = null;
let _wallet   = null;
let _keyPair  = null;
let _address  = null;
let _ready    = false;

export async function initDeployerWallet() {
  try {
    _client = new TonClient({
      endpoint: TESTNET_ENDPOINT,
      apiKey: process.env.TONCENTER_API_KEY || "",
    });

    let words;
    const envMnemonic = process.env.TON_DEPLOYER_MNEMONIC;
    if (envMnemonic && envMnemonic.trim().split(/\s+/).length >= 12) {
      words = envMnemonic.trim().split(/\s+/);
      console.log("[TON] Loaded deployer wallet from TON_DEPLOYER_MNEMONIC");
    } else {
      words = await mnemonicNew(24);
      console.log("[TON] ══════════════════════════════════════════════════");
      console.log("[TON] NEW DEPLOYER WALLET GENERATED");
      console.log("[TON] Save this mnemonic as secret TON_DEPLOYER_MNEMONIC:");
      console.log("[TON]", words.join(" "));
      console.log("[TON] ══════════════════════════════════════════════════");
    }

    _keyPair = await mnemonicToPrivateKey(words);
    _wallet  = WalletContractV4.create({ publicKey: _keyPair.publicKey, workchain: 0 });
    _address = _wallet.address.toString({ testOnly: true, bounceable: false });

    const balanceNano = await getAddressBalance(_wallet.address.toString({ testOnly: true }));
    const balanceTon  = (Number(balanceNano) / 1e9).toFixed(3);

    console.log(`[TON] Deployer address : ${_address}`);
    console.log(`[TON] Testnet balance  : ${balanceTon} tTON`);

    if (Number(balanceNano) < 50_000_000) {
      console.log("[TON] ⚠️  Balance < 0.05 tTON — fund via https://t.me/testgiver_ton_bot");
      console.log(`[TON] ⚠️  Address to fund: ${_address}`);
    } else {
      _ready = true;
      console.log("[TON] ✅ Deployer wallet ready — on-chain TONIC rewards enabled");
    }

    return { address: _address, balanceTon, ready: _ready };
  } catch (err) {
    console.error("[TON] Wallet init failed:", err.message);
    return { address: null, balanceTon: "0", ready: false };
  }
}

/**
 * Send a TONIC reward transaction to a user's TON wallet.
 * This creates a REAL, verifiable on-chain transaction on TON testnet.
 *
 * @param {string} userWalletAddress  - User's TON wallet (testnet)
 * @param {number} tonicAmount        - Amount of $TONIC earned
 * @param {string} reason             - Reason code (e.g. "task_complete", "streak_7")
 * @returns {{ success: boolean, txHash?: string, explorerUrl?: string, error?: string }}
 */
export async function sendTonicReward(userWalletAddress, tonicAmount, reason) {
  if (!_client || !_wallet || !_keyPair) {
    return { success: false, error: "wallet_not_initialized" };
  }

  try {
    const balanceNano = await getAddressBalance(_wallet.address.toString({ testOnly: true }));
    if (Number(balanceNano) < 10_000_000) {
      return { success: false, error: "deployer_unfunded" };
    }

    const contract = _client.open(_wallet);
    const seqno    = await contract.getSeqno();

    // Encode TONIC reward as comment: "TONIC:50:streak_7"
    const comment  = `TONIC:${tonicAmount}:${reason}`;
    const body = beginCell()
      .storeUint(0, 32)          // text comment opcode
      .storeStringTail(comment)
      .endCell();

    await contract.sendTransfer({
      secretKey: _keyPair.secretKey,
      seqno,
      messages: [
        internal({
          to:    userWalletAddress,
          value: toNano("0.001"), // dust — just enough to carry the payload
          body,
          bounce: false,
        }),
      ],
    });

    // Poll for the transaction hash (up to 15s)
    const txHash = await pollForTx(_wallet.address.toString({ testOnly: true }), seqno);
    const explorerUrl = txHash
      ? `https://testnet.tonscan.org/tx/${txHash}`
      : `https://testnet.tonscan.org/address/${_address}`;

    console.log(`[TON] ✅ TONIC reward sent: ${tonicAmount} TONIC to ${userWalletAddress} | ${comment}`);
    return { success: true, txHash, explorerUrl, comment };
  } catch (err) {
    console.error("[TON] sendTonicReward error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send an on-chain achievement record transaction.
 * Creates a verifiable on-chain record of the achievement unlock.
 */
export async function recordAchievementOnChain(userWalletAddress, achievementId, achievementTitle) {
  if (!_ready) return { success: false, error: "wallet_not_ready" };

  const reason = `ACH:${achievementId.slice(0, 20)}`;
  return sendTonicReward(userWalletAddress, 0, reason);
}

/**
 * Get the deployer wallet address and current balance.
 */
export async function getDeployerInfo() {
  if (!_address) return { address: null, balanceTon: "0", ready: false };
  const balanceNano = await getAddressBalance(_wallet.address.toString({ testOnly: true }));
  const balanceTon  = (Number(balanceNano) / 1e9).toFixed(4);
  _ready = Number(balanceNano) >= 10_000_000;
  return { address: _address, balanceTon, ready: _ready };
}

export function isDeployerReady() { return _ready; }

// ── Internal helpers ──────────────────────────────────────────────────────────

async function pollForTx(address, targetSeqno, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(2000);
    try {
      const { getTransactions } = await import("./client.mjs");
      const txs = await getTransactions(address, 5);
      if (Array.isArray(txs) && txs.length > 0) {
        const latest = txs[0];
        const hash = latest?.transaction_id?.hash;
        if (hash) return hash;
      }
    } catch { /* keep polling */ }
  }
  return null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
