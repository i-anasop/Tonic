function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export const API_BASE_URL = getApiBaseUrl();

export const TON_REWARD_ADDRESS = "EQBIhPuWmjT7fP-VomuTWseE8JNWv2q7QYfsVQ1IZwnMk8wL";

export const TON_NANO = 1000000000n;
export const TON_TASK_REWARD = (1000000n).toString();
export const TON_MILESTONE_REWARD = (10000000n).toString();
