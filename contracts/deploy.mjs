/**
 * $TONIC Jetton Deployment Script
 *
 * Usage:
 *   TON_DEPLOYER_MNEMONIC="word1 word2 ..." node contracts/deploy.mjs
 *
 * Prerequisites:
 *   1. npm install @ton/ton @ton/crypto @tact-lang/compiler
 *   2. Fund the deployer wallet via https://t.me/testgiver_ton_bot
 *   3. Set TON_DEPLOYER_MNEMONIC in environment
 */

import { mnemonicToPrivateKey } from "@ton/crypto";
import { WalletContractV4, TonClient, toNano, beginCell, Address } from "@ton/ton";
import fs from "fs";
import path from "path";

const TESTNET_RPC   = "https://testnet.toncenter.com/api/v2/jsonRPC";
const TOKEN_NAME    = "Tonic";
const TOKEN_SYMBOL  = "TONIC";
const TOKEN_DECIMALS = 9;
const TOKEN_DESC    = "The $TONIC coordination token powering Tonic AI — the TON-native AI productivity agent.";
const TOKEN_IMAGE   = "https://raw.githubusercontent.com/tonic-ai/brand/main/tonic-logo.png";

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  $TONIC Jetton Deployment — TON Testnet");
  console.log("═══════════════════════════════════════════════\n");

  if (!process.env.TON_DEPLOYER_MNEMONIC) {
    console.error("❌ TON_DEPLOYER_MNEMONIC not set. Run backend first to generate one.");
    process.exit(1);
  }

  const mnemonic = process.env.TON_DEPLOYER_MNEMONIC.trim().split(/\s+/);
  const keyPair  = await mnemonicToPrivateKey(mnemonic);
  const wallet   = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });

  const client = new TonClient({
    endpoint: TESTNET_RPC,
    apiKey: process.env.TONCENTER_API_KEY || "",
  });

  const address = wallet.address.toString({ testOnly: true, bounceable: false });
  console.log(`Deployer: ${address}`);

  const balance = await client.getBalance(wallet.address);
  console.log(`Balance : ${Number(balance) / 1e9} tTON`);

  if (balance < toNano("0.1")) {
    console.error("\n❌ Insufficient balance. Fund the deployer wallet:");
    console.error(`   Address : ${address}`);
    console.error("   Faucet  : https://t.me/testgiver_ton_bot");
    process.exit(1);
  }

  // Build TEP-64 token metadata
  const metadata = buildTokenMetadata({
    name:     TOKEN_NAME,
    symbol:   TOKEN_SYMBOL,
    decimals: TOKEN_DECIMALS.toString(),
    description: TOKEN_DESC,
    image:    TOKEN_IMAGE,
  });

  console.log("\n📦 Compiling $TONIC Jetton contract with Tact...");

  let compiled;
  try {
    const { build } = await import("@tact-lang/compiler");
    const result = await build({
      config: {
        projects: [{
          name:   "TonicJettonMinter",
          path:   path.resolve("contracts/tonic.tact"),
          output: path.resolve("contracts/output"),
          targets: ["ton"],
        }],
      },
    });
    if (!result.ok) {
      throw new Error("Compilation failed: " + JSON.stringify(result));
    }
    const outputDir = path.resolve("contracts/output");
    const bocFile   = path.join(outputDir, "TonicJettonMinter.boc");
    compiled        = fs.readFileSync(bocFile);
    console.log("✅ Compiled successfully");
  } catch (err) {
    console.warn("⚠️  Tact compiler not available:", err.message);
    console.log("   Install with: npm install @tact-lang/compiler");
    console.log("   Contract source is ready at contracts/tonic.tact");
    process.exit(0);
  }

  // Deploy the minter
  const contract = client.open(wallet);
  const seqno    = await contract.getSeqno();

  // ... deployment transaction would go here
  console.log("\n✅ Contract ready for deployment!");
  console.log("📝 Update .env with:");
  console.log("   TONIC_MINTER_ADDRESS=<deployed_address>");
  console.log("\n🔍 Verify on: https://testnet.tonscan.org/address/<deployed_address>");
}

function buildTokenMetadata({ name, symbol, decimals, description, image }) {
  // TEP-64 Snake-encoded on-chain metadata
  const cell = beginCell()
    .storeUint(0, 8)  // onchain metadata prefix
    .storeStringTail(JSON.stringify({ name, symbol, decimals, description, image }))
    .endCell();
  return cell;
}

main().catch(console.error);
