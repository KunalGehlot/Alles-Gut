import { Pool, PoolClient, QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = {
  query: <T extends QueryResultRow>(text: string, params?: unknown[]) => pool.query<T>(text, params),

  getClient: async (): Promise<PoolClient> => {
    const client = await pool.connect();
    return client;
  },

  transaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  end: () => pool.end(),
};

export const query = db.query;

export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected at:', result.rows[0].now);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}
