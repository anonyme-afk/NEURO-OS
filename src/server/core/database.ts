import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.resolve(dataDir, 'neuro_os.db');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS connectors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    encrypted_config TEXT NOT NULL,
    last_health_check TEXT,
    status TEXT DEFAULT 'unknown'
  );

  CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export interface ConnectorRecord {
  id: string;
  name: string;
  type: string;
  is_active: number;
  encrypted_config: string;
  last_health_check?: string;
  status?: string;
}

export const dbOps = {
  // Connectors
  upsertConnector: (connector: ConnectorRecord) => {
    const stmt = db.prepare(`
      INSERT INTO connectors (id, name, type, is_active, encrypted_config)
      VALUES (@id, @name, @type, @is_active, @encrypted_config)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        type=excluded.type,
        is_active=excluded.is_active,
        encrypted_config=excluded.encrypted_config
    `);
    return stmt.run(connector);
  },

  listConnectors: (): ConnectorRecord[] => {
    return db.prepare('SELECT * FROM connectors').all() as ConnectorRecord[];
  },

  deleteConnector: (id: string) => {
    return db.prepare('DELETE FROM connectors WHERE id = ?').run(id);
  },

  updateStatus: (id: string, status: string) => {
    return db.prepare('UPDATE connectors SET status = ?, last_health_check = ? WHERE id = ?')
      .run(status, new Date().toISOString(), id);
  },

  // System Config
  setSetting: (key: string, value: string) => {
    const stmt = db.prepare(`
      INSERT INTO system_config (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `);
    return stmt.run(key, value);
  },

  getSetting: (key: string, defaultValue?: string): string | undefined => {
    const row = db.prepare('SELECT value FROM system_config WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : defaultValue;
  }
};

export default db;
