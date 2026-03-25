export const TONIC_PER_TASK = 15; // default / fallback
export const TONIC_REWARD_BY_PRIORITY = { high: 25, medium: 15, low: 10 };
export const TONIC_STREAK_BONUS = 25;
export const TONIC_DAILY_CHALLENGE = 50;

export const AI_MODEL = "gpt-4o";

export const DAILY_CHALLENGES = [
  { id: "c1", title: "Complete 3 tasks today",                   target: 3, type: "tasks",          reward: 50 },
  { id: "c2", title: "Finish a high-priority task",              target: 1, type: "high_priority",   reward: 60 },
  { id: "c3", title: "Clear all overdue tasks",                  target: 1, type: "overdue",         reward: 75 },
  { id: "c4", title: "Complete a health or learning task",       target: 1, type: "category_growth", reward: 45 },
  { id: "c5", title: "Complete 2 work tasks before noon",        target: 2, type: "morning_work",    reward: 55 },
];

export const MOCK_LEADERS = [
  { id: "mock_1",  name: "DeFi_Pro",      wallet_address: "UQBpro...x1",   tonic_tokens: 28400, completed_tasks: 284, total_tasks: 296, completion_rate: 96, score: 31240 },
  { id: "mock_2",  name: "CryptoNinja",   wallet_address: "UQBninja...x2", tonic_tokens: 21600, completed_tasks: 216, total_tasks: 224, completion_rate: 96, score: 23760 },
  { id: "mock_3",  name: "BlockStar",     wallet_address: "UQBstar...x3",  tonic_tokens: 16500, completed_tasks: 165, total_tasks: 178, completion_rate: 93, score: 18150 },
  { id: "mock_4",  name: "TONQueen",      wallet_address: null,             tonic_tokens: 11200, completed_tasks: 112, total_tasks: 126, completion_rate: 89, score: 12320 },
  { id: "mock_5",  name: "GrindKing",     wallet_address: null,             tonic_tokens:  7300, completed_tasks:  73, total_tasks:  82, completion_rate: 89, score:  8030 },
  { id: "mock_6",  name: "TON_Wizard",    wallet_address: "UQBwiz...x6",   tonic_tokens:  5800, completed_tasks:  58, total_tasks:  65, completion_rate: 89, score:  6380 },
  { id: "mock_7",  name: "BlockBuilder",  wallet_address: null,             tonic_tokens:  4200, completed_tasks:  42, total_tasks:  50, completion_rate: 84, score:  4620 },
  { id: "mock_8",  name: "ChainHunter",   wallet_address: "UQBhunt...x8",  tonic_tokens:  3100, completed_tasks:  31, total_tasks:  37, completion_rate: 84, score:  3410 },
  { id: "mock_9",  name: "MythicGrinder", wallet_address: null,             tonic_tokens:  2400, completed_tasks:  24, total_tasks:  29, completion_rate: 83, score:  2640 },
  { id: "mock_10", name: "SolanaKid",     wallet_address: null,             tonic_tokens:  1900, completed_tasks:  19, total_tasks:  24, completion_rate: 79, score:  2090 },
  { id: "mock_11", name: "TaskMaster99",  wallet_address: "UQBtm...x11",   tonic_tokens:  1500, completed_tasks:  15, total_tasks:  19, completion_rate: 79, score:  1650 },
  { id: "mock_12", name: "LegendBit",     wallet_address: null,             tonic_tokens:  1100, completed_tasks:  11, total_tasks:  15, completion_rate: 73, score:  1210 },
  { id: "mock_13", name: "web3_rose",     wallet_address: "UQBrose...x13", tonic_tokens:   800, completed_tasks:   8, total_tasks:  12, completion_rate: 67, score:   880 },
  { id: "mock_14", name: "DiamondHands",  wallet_address: null,             tonic_tokens:   500, completed_tasks:   5, total_tasks:   8, completion_rate: 63, score:   550 },
  { id: "mock_15", name: "RookieCrypto",  wallet_address: null,             tonic_tokens:   200, completed_tasks:   2, total_tasks:   4, completion_rate: 50, score:   220 },
];

export const PORTRAIT_CSS = `
  <style id="portrait-mobile">
    html { height: 100%; margin: 0; padding: 0; background-color: #060810; }
    body {
      margin: 0; padding: 0; height: 100%; overflow: hidden;
      background-color: #060810;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,215,0,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(100,160,255,0.04) 0%, transparent 50%);
      display: flex; flex-direction: row; justify-content: center; align-items: stretch;
    }
    #root { display: flex; flex: 1; height: 100%; width: 100%; max-width: 430px; overflow: hidden; position: relative; }
    @media (min-width: 431px) {
      #root {
        box-shadow:
          0 0 0 1px rgba(255,215,0,0.13),
          0 12px 80px rgba(0,0,0,0.75),
          0 0 60px rgba(255,215,0,0.05);
      }
    }
  </style>
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="apple-touch-icon" href="/logo.png" />
  <meta name="theme-color" content="#0D1117" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Tonic AI" />
`;
