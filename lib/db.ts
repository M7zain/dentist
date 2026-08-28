import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

export function getPool() {
  if (!globalForDb.pool) {
    globalForDb.pool = mysql.createPool({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      timezone: "+03:00",
    });
  }
  return globalForDb.pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: Record<string, unknown> | unknown[]
) {
  const [rows] = await getPool().execute(sql, params as never);
  return rows as T;
}
