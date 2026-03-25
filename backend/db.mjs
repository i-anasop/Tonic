import pg from "pg";

export const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      wallet_address   TEXT,
      is_guest         BOOLEAN      DEFAULT TRUE,
      ton_proof        TEXT,
      verified_at      TIMESTAMP,
      tonic_tokens     INT          DEFAULT 0,
      sync_code        TEXT,
      last_daily_challenge  DATE,
      daily_challenge_done  BOOLEAN  DEFAULT FALSE,
      created_at       TIMESTAMP    DEFAULT NOW(),
      updated_at       TIMESTAMP    DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id              TEXT PRIMARY KEY,
      user_id         TEXT REFERENCES users(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      description     TEXT,
      category        TEXT NOT NULL DEFAULT 'work',
      priority        TEXT NOT NULL DEFAULT 'medium',
      status          TEXT NOT NULL DEFAULT 'pending',
      due_date        TIMESTAMP NOT NULL,
      created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at    TIMESTAMP,
      ai_suggested    BOOLEAN   DEFAULT FALSE,
      stake_amount    NUMERIC,
      stake_tx_hash   TEXT
    );

    CREATE TABLE IF NOT EXISTS on_chain_records (
      id           TEXT PRIMARY KEY,
      user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
      record_type  TEXT NOT NULL,
      title        TEXT NOT NULL,
      description  TEXT,
      ton_tx_hash  TEXT,
      recorded_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agent_conversations (
      id         TEXT PRIMARY KEY,
      user_id    TEXT,
      messages   JSONB     NOT NULL DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE tasks  ADD COLUMN IF NOT EXISTS ai_suggested    BOOLEAN   DEFAULT FALSE;
    ALTER TABLE tasks  ADD COLUMN IF NOT EXISTS stake_amount     NUMERIC;
    ALTER TABLE tasks  ADD COLUMN IF NOT EXISTS stake_tx_hash    TEXT;
    ALTER TABLE tasks  ADD COLUMN IF NOT EXISTS completed_at     TIMESTAMP;
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS ton_proof        TEXT;
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS verified_at      TIMESTAMP;
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP DEFAULT NOW();
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS tonic_tokens     INT       DEFAULT 0;
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS sync_code        TEXT;
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS last_daily_challenge DATE;
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS daily_challenge_done BOOLEAN DEFAULT FALSE;
  `);

  console.log("[DB] Database initialized");
}
