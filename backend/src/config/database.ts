import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/freelancer-tax.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      business_name TEXT,
      business_type TEXT DEFAULT 'freelancer',
      country TEXT DEFAULT 'US',
      state TEXT,
      currency TEXT DEFAULT 'USD',
      timezone TEXT DEFAULT 'America/New_York',
      email_verified INTEGER DEFAULT 0,
      stripe_customer_id TEXT,
      subscription_tier TEXT DEFAULT 'free',
      subscription_expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      vendor TEXT,
      invoice_number TEXT,
      is_deductible INTEGER DEFAULT 1,
      deduction_percentage INTEGER DEFAULT 100,
      deductible_amount REAL,
      tax_year INTEGER,
      quarter INTEGER,
      notes TEXT,
      tags TEXT DEFAULT '[]',
      deleted_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS income_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      client_name TEXT,
      project_name TEXT,
      income_type TEXT DEFAULT 'project',
      tax_year INTEGER,
      quarter INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tax_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tax_year INTEGER NOT NULL,
      quarter INTEGER,
      total_income REAL DEFAULT 0,
      total_deductions REAL DEFAULT 0,
      net_income REAL DEFAULT 0,
      taxable_income REAL DEFAULT 0,
      federal_tax REAL DEFAULT 0,
      state_tax REAL DEFAULT 0,
      self_employment_tax REAL DEFAULT 0,
      total_tax REAL DEFAULT 0,
      estimated_quarterly_payment REAL DEFAULT 0,
      payments_made REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT DEFAULT 'free',
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT,
      status TEXT DEFAULT 'active',
      current_period_start TEXT,
      current_period_end TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user_year ON expenses(user_id, tax_year);
    CREATE INDEX IF NOT EXISTS idx_income_user_year ON income_records(user_id, tax_year);
    CREATE INDEX IF NOT EXISTS idx_tax_calcs_user_year ON tax_calculations(user_id, tax_year);
  `);

  console.log('Database initialized');
}

export default db;
