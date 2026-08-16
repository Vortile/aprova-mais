import type { Database } from "@repo/db";

type PublicTables = Database["public"]["Tables"];
type TableName = keyof PublicTables;

export type TableRow<T extends TableName> = PublicTables[T]["Row"];
export type TableInsert<T extends TableName> = PublicTables[T]["Insert"];
export type TableUpdate<T extends TableName> = PublicTables[T]["Update"];

export function asSupabaseInsert<T extends TableName>(values: TableInsert<T>) {
  return values as never;
}

export function asSupabaseUpdate<T extends TableName>(values: TableUpdate<T>) {
  return values as never;
}

export function asSupabaseRows<T extends TableName>(rows: unknown) {
  return rows as TableRow<T>[] | null;
}

export function asSupabaseRow<T extends TableName>(row: unknown) {
  return row as TableRow<T> | null;
}
