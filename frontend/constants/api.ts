function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://4134e415-ecd2-4b0e-86de-4619963e1f41-00-3jthtt2pvqs7.pike.replit.dev";
}

export const API_BASE_URL = getApiBaseUrl();

export const TON_REWARD_ADDRESS = "EQBIhPuWmjT7fP-VomuTWseE8JNWv2q7QYfsVQ1IZwnMk8wL";

export const TON_NANO = 1000000000n;
export const TON_TASK_REWARD = (1000000n).toString();
export const TON_MILESTONE_REWARD = (10000000n).toString();
