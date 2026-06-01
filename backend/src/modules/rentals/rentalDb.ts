import type { QueryResultRow } from "pg";
import { pool } from "../../db/pool";

export const rentalDb = {
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    const result = await pool.query<T>(text, params);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  },
};
