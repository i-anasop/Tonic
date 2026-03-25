/**
 * TON Testnet client — wraps Toncenter v2 HTTP API.
 * No deployment required. Used for balance reads + tx broadcasting.
 */

const BASE = "https://testnet.toncenter.com/api/v2";
const API_KEY = process.env.TONCENTER_API_KEY || "";

async function toncenterGet(method, params = {}) {
  const url = new URL(`${BASE}/${method}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: API_KEY ? { "X-API-Key": API_KEY } : {},
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Toncenter error: ${json.error || JSON.stringify(json)}`);
  return json.result;
}

async function toncenterPost(method, body = {}) {
  const res = await fetch(`${BASE}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Toncenter error: ${json.error || JSON.stringify(json)}`);
  return json.result;
}

/**
 * Get native TON balance for an address (returns nanoton as bigint string).
 */
export async function getAddressBalance(address) {
  try {
    const result = await toncenterGet("getAddressBalance", { address });
    return result; // string nanoton
  } catch {
    return "0";
  }
}

/**
 * Get address information (state, balance, etc).
 */
export async function getAddressInfo(address) {
  try {
    return await toncenterGet("getAddressInformation", { address });
  } catch {
    return null;
  }
}

/**
 * Get recent transactions for an address.
 */
export async function getTransactions(address, limit = 10) {
  try {
    return await toncenterGet("getTransactions", { address, limit });
  } catch {
    return [];
  }
}

/**
 * Send a signed BOC to the network.
 */
export async function sendBoc(boc) {
  return await toncenterPost("sendBoc", { boc });
}

export { toncenterGet, toncenterPost };
