import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

let db: Client;
let initialized = false;

async function initDB(): Promise<Client> {
  if (initialized) return db!;

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const dbPath = path.resolve(dataDir, 'neuro_os.db');

  db = createClient({
    url: `file:${dbPath}`
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      encrypted_config TEXT NOT NULL,
      last_health_check TEXT,
      status TEXT DEFAULT 'unknown'
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  initialized = true;
  return db;
}

export interface ConnectorRecord {
  id: string;
  name: string;
  type: string;
  is_active: number;
  encrypted_config: string;
  last_health_check?: string;
  status?: string;
}

async function getDB(): Promise<Client> {
  return initDB();
}

export const dbOps = {
  // Connectors
  upsertConnector: async (connector: ConnectorRecord) => {
    const client = await getDB();
    return client.execute({
      sql: `INSERT INTO connectors (id, name, type, is_active, encrypted_config)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name,
              type=excluded.type,
              is_active=excluded.is_active,
              encrypted_config=excluded.encrypted_config`,
      args: [connector.id, connector.name, connector.type, connector.is_active, connector.encrypted_config]
    });
  },

  listConnectors: async (): Promise<ConnectorRecord[]> => {
    const client = await getDB();
    const result = await client.execute('SELECT * FROM connectors');
    return result.rows as unknown as ConnectorRecord[];
  },

  deleteConnector: async (id: string) => {
    const client = await getDB();
    return client.execute({
      sql: 'DELETE FROM connectors WHERE id = ?',
      args: [id]
    });
  },

  updateStatus: async (id: string, status: string) => {
    const client = await getDB();
    return client.execute({
      sql: 'UPDATE connectors SET status = ?, last_health_check = ? WHERE id = ?',
      args: [status, new Date().toISOString(), id]
    });
  },

  // System Config
  setSetting: async (key: string, value: string) => {
    const client = await getDB();
    return client.execute({
      sql: `INSERT INTO system_config (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      args: [key, value]
    });
  },

  getSetting: async (key: string, defaultValue?: string): Promise<string | undefined> => {
    const client = await getDB();
    const result = await client.execute({
      sql: 'SELECT value FROM system_config WHERE key = ?',
      args: [key]
    });
    const row = result.rows[0] as { value: string } | undefined;
    return row ? row.value : defaultValue;
  }
};

export default db;