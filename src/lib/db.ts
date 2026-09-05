import pg from "pg";

type PgPool = {
  query: (text: string, values?: unknown[]) => Promise<any>;
  connect: () => Promise<any>;
  end: () => Promise<void>;
};

const { Pool } = pg as unknown as { Pool: new (options: Record<string, unknown>) => PgPool };

export type QueryResult<T = Record<string, unknown>> = {
  data: any;
  error: Error | null;
  count: number | null;
};

let pool: PgPool | null = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL non configuree");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 10_000),
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 5_000),
    });
  }
  return pool;
}

const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertIdentifier(value: string): string {
  if (!IDENTIFIER.test(value)) throw new Error(`Identifiant SQL invalide: ${value}`);
  return `"${value}"`;
}

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (quote) {
      if (char === quote && value[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    } else if (char === "," && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = value.slice(start).trim();
  if (last) parts.push(last);
  return parts;
}

type Relation = {
  table: string;
  localKey: string;
  foreignKey: string;
  many?: boolean;
};

const RELATIONS: Record<string, Record<string, Relation>> = {
  sessions: {
    profile: { table: "profiles", localKey: "user_id", foreignKey: "id" },
  },
  insurer_accounts: {
    insurer: { table: "insurers", localKey: "insurer_id", foreignKey: "id" },
    profile: { table: "profiles", localKey: "profile_id", foreignKey: "id" },
  },
  insurance_offers: {
    insurer: { table: "insurers", localKey: "insurer_id", foreignKey: "id" },
    category: { table: "insurance_categories", localKey: "category_id", foreignKey: "id" },
  },
  coverages: {
    insurer: { table: "insurers", localKey: "insurer_id", foreignKey: "id" },
    category: { table: "coverage_categories", localKey: "category_id", foreignKey: "id" },
  },
  quotes: {
    offer: { table: "insurance_offers", localKey: "offer_id", foreignKey: "id" },
    user: { table: "profiles", localKey: "user_id", foreignKey: "id" },
    category: { table: "insurance_categories", localKey: "category_id", foreignKey: "id" },
    coverageLines: { table: "quote_coverages", localKey: "id", foreignKey: "quote_id", many: true },
  },
  contracts: {
    offer: { table: "insurance_offers", localKey: "offer_id", foreignKey: "id" },
    insurer: { table: "insurers", localKey: "insurer_id", foreignKey: "id" },
    profile: { table: "profiles", localKey: "profile_id", foreignKey: "id" },
  },
  package_coverages: {
    coverage: { table: "coverages", localKey: "coverage_id", foreignKey: "id" },
  },
  reviews: {
    insurer: { table: "insurers", localKey: "insurer_id", foreignKey: "id" },
  },
};

function parseRelationToken(token: string): { alias: string; table: string; selection: string } | null {
  const match = token.match(/^([a-zA-Z_][a-zA-Z0-9_]*):?([a-zA-Z_][a-zA-Z0-9_]*)(?:!inner)?\(([\s\S]*)\)$/);
  if (!match) return null;
  return { alias: match[1], table: match[2], selection: match[3] };
}

function parseColumnToken(token: string): { alias: string; column: string } | null {
  const match = token.match(/^([a-zA-Z_][a-zA-Z0-9_]*):([a-zA-Z_][a-zA-Z0-9_]*)$/);
  if (match) return { alias: match[1], column: match[2] };
  if (IDENTIFIER.test(token)) return { alias: token, column: token };
  return null;
}

function projectRow(row: Record<string, unknown>, selection: string): Record<string, unknown> {
  if (!selection || selection.trim() === "*") return { ...row };
  const result: Record<string, unknown> = {};
  for (const token of splitTopLevel(selection)) {
    const relation = parseRelationToken(token);
    if (relation) {
      if (relation.alias in row) result[relation.alias] = row[relation.alias];
      continue;
    }
    const column = parseColumnToken(token);
    if (column) result[column.alias] = row[column.column];
  }
  return result;
}

async function fetchRelation(parent: string, relationName: string, row: Record<string, unknown>, selection: string) {
  const relation = RELATIONS[parent]?.[relationName];
  if (!relation) return null;
  const database = getPool();
  const localValue = row[relation.localKey];
  if (localValue == null) return relation.many ? [] : null;
  const sql = relation.many
    ? `select * from ${assertIdentifier(relation.table)} where ${assertIdentifier(relation.foreignKey)} = $1`
    : `select * from ${assertIdentifier(relation.table)} where ${assertIdentifier(relation.foreignKey)} = $1 limit 1`;
  const result = await database.query(sql, [localValue]);
  const projected = result.rows.map((child) => projectRow(child, selection));
  return relation.many ? projected : projected[0] ?? null;
}

async function hydrateRows(table: string, rows: Record<string, unknown>[], selection: string) {
  if (!selection || selection.trim() === "*") return rows;
  const tokens = splitTopLevel(selection);
  const relations = tokens.map(parseRelationToken).filter(Boolean) as { alias: string; table: string; selection: string }[];
  if (!relations.length) return rows.map((row) => projectRow(row, selection));
  return Promise.all(rows.map(async (row) => {
    const output = projectRow(row, selection);
    for (const relation of relations) {
      output[relation.alias] = await fetchRelation(table, relation.alias, row, relation.selection);
    }
    return output;
  }));
}

type Filter = { column: string; operator: string; value: unknown };

class NativeQuery<T extends Record<string, unknown> = Record<string, unknown>> implements PromiseLike<QueryResult<T>> {
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private values: Record<string, unknown>[] = [];
  private updateValues: Record<string, unknown> = {};
  private filters: Filter[] = [];
  private orGroups: Filter[][] = [];
  private deferredFilters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitValue: number | null = null;
  private offsetValue = 0;
  private selection = "*";
  private returnSelection: string | null = null;
  private countRequested = false;
  private headOnly = false;
  private conflict: string | null = null;
  private ignoreDuplicates = false;

  constructor(private readonly table: string) {
    assertIdentifier(table);
  }

  from(table: string) { return new NativeQuery(table); }

  select(selection = "*", options?: { count?: "exact"; head?: boolean }) {
    if (this.operation === "select") this.selection = selection;
    else this.returnSelection = selection;
    this.countRequested ||= options?.count === "exact";
    this.headOnly ||= options?.head === true;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = "insert";
    this.values = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.operation = "insert";
    this.values = Array.isArray(values) ? values : [values];
    this.conflict = options?.onConflict || null;
    this.ignoreDuplicates = options?.ignoreDuplicates === true;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.operation = "update";
    this.updateValues = values;
    return this;
  }

  delete() { this.operation = "delete"; return this; }

  eq(column: string, value: unknown) { return this.addFilter(column, "=", value); }
  neq(column: string, value: unknown) { return this.addFilter(column, "<>", value); }
  gt(column: string, value: unknown) { return this.addFilter(column, ">", value); }
  gte(column: string, value: unknown) { return this.addFilter(column, ">=", value); }
  lt(column: string, value: unknown) { return this.addFilter(column, "<", value); }
  lte(column: string, value: unknown) { return this.addFilter(column, "<=", value); }
  ilike(column: string, value: unknown) { return this.addFilter(column, "ilike", value); }
  is(column: string, value: null | boolean) { return this.addFilter(column, value === null ? "is null" : "is", value); }
  not(column: string, operator: string, value: unknown) {
    return this.addFilter(column, operator === "is" && value === null ? "is not null" : `not ${operator}`, value);
  }
  in(column: string, values: unknown[]) { return this.addFilter(column, "in", values); }

  private addFilter(column: string, operator: string, value: unknown) {
    const filter = { column, operator, value };
    (column.includes(".") ? this.deferredFilters : this.filters).push(filter);
    return this;
  }

  or(value: string) {
    const group: Filter[] = [];
    for (const expression of value.split(",")) {
      const match = expression.match(/^([\w.]+)\.(eq|ilike|neq)\.(.*)$/);
      if (match) group.push({ column: match[1], operator: match[2] === "eq" ? "=" : match[2], value: match[3] });
    }
    if (group.length) this.orGroups.push(group);
    return this;
  }

  order(column: string, options?: { ascending?: boolean; referencedTable?: string }) {
    this.orderBy.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(value: number) { this.limitValue = value; return this; }
  range(from: number, to: number) { this.offsetValue = from; this.limitValue = to - from + 1; return this; }
  single() { return this.then((result) => ({ ...result, data: Array.isArray(result.data) ? result.data[0] ?? null : result.data })); }
  maybeSingle() { return this.single(); }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null) {
    return this.execute().catch(onrejected);
  }

  private async execute(): Promise<QueryResult<T>> {
    getPool();
    try {
      if (this.operation === "select") return await this.executeSelect();
      if (this.operation === "insert") return await this.executeInsert();
      if (this.operation === "update") return await this.executeUpdate();
      return await this.executeDelete();
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)), count: null };
    }
  }

  private whereSql(startIndex: number) {
    const values: unknown[] = [];
    const buildClause = (filter: Filter) => {
      if (filter.operator === "is null") return `${assertIdentifier(filter.column)} is null`;
      if (filter.operator === "is not null") return `${assertIdentifier(filter.column)} is not null`;
      if (filter.operator === "is") return `${assertIdentifier(filter.column)} is ${filter.value ? "true" : "false"}`;
      if (filter.operator === "in") {
        const placeholders = (filter.value as unknown[]).map((value) => {
          values.push(value);
          return `$${startIndex + values.length - 1}`;
        });
        return `${assertIdentifier(filter.column)} in (${placeholders.join(",") || "null"})`;
      }
      values.push(filter.value);
      const operator = filter.operator === "ilike" ? "ilike" : filter.operator;
      return `${assertIdentifier(filter.column)} ${operator} $${startIndex + values.length - 1}`;
    };
    const clauses = this.filters.map(buildClause);
    for (const group of this.orGroups) clauses.push(`(${group.map(buildClause).join(" or ")})`);
    return { sql: clauses.length ? ` where ${clauses.join(" and ")}` : "", values };
  }

  private async executeSelect(): Promise<QueryResult<T>> {
    const where = this.whereSql(1);
    const order = this.orderBy.length
      ? ` order by ${this.orderBy.map((item) => `${assertIdentifier(item.column)} ${item.ascending ? "asc" : "desc"}`).join(",")}`
      : "";
    const limit = this.limitValue == null ? "" : ` limit ${this.limitValue}`;
    const offset = this.offsetValue ? ` offset ${this.offsetValue}` : "";
    const result = await getPool().query(`select * from ${assertIdentifier(this.table)}${where.sql}${order}${limit}${offset}`, where.values);
    let rows = await hydrateRows(this.table, result.rows, this.selection);
    rows = this.applyDeferredFilters(rows);
    const count = this.countRequested ? rows.length : null;
    return { data: this.headOnly ? null : rows as T[], error: null, count };
  }

  private applyDeferredFilters(rows: Record<string, unknown>[]) {
    return rows.filter((row) => this.deferredFilters.every((filter) => {
      const [relation, key] = filter.column.split(".");
      const value = (row[relation] as Record<string, unknown> | null)?.[key];
      if (filter.operator === "=") return String(value) === String(filter.value);
      if (filter.operator === "ilike") return String(value || "").toLowerCase().includes(String(filter.value).replace(/%/g, "").toLowerCase());
      return true;
    }));
  }

  private async executeInsert(): Promise<QueryResult<T>> {
    if (!this.values.length) return { data: [], error: null, count: 0 };
    const columns = Object.keys(this.values[0]);
    const params: unknown[] = [];
    const rows = this.values.map((value) => `(${columns.map((column) => { params.push(value[column]); return `$${params.length}`; }).join(",")})`);
    let conflict = "";
    if (this.conflict) conflict = ` on conflict (${this.conflict.split(",").map(assertIdentifier).join(",")}) ${this.ignoreDuplicates ? "do nothing" : "do update set " + columns.map((column) => `${assertIdentifier(column)} = excluded.${assertIdentifier(column)}`).join(",")}`;
    else if (this.ignoreDuplicates) conflict = " on conflict do nothing";
    const returning = this.returnSelection ? " returning *" : "";
    const result = await getPool().query(`insert into ${assertIdentifier(this.table)} (${columns.map(assertIdentifier).join(",")}) values ${rows.join(",")}${conflict}${returning}`, params);
    const data = this.returnSelection ? await hydrateRows(this.table, result.rows, this.returnSelection) : null;
    return { data: data as T[] | null, error: null, count: result.rowCount };
  }

  private async executeUpdate(): Promise<QueryResult<T>> {
    const columns = Object.keys(this.updateValues);
    const values = columns.map((column) => this.updateValues[column]);
    const where = this.whereSql(columns.length + 1);
    const set = columns.map((column, index) => `${assertIdentifier(column)} = $${index + 1}`).join(",");
    const result = await getPool().query(`update ${assertIdentifier(this.table)} set ${set}${where.sql}${this.returnSelection ? " returning *" : ""}`, [...values, ...where.values]);
    const data = this.returnSelection ? await hydrateRows(this.table, result.rows, this.returnSelection) : null;
    return { data: data as T[] | null, error: null, count: result.rowCount };
  }

  private async executeDelete(): Promise<QueryResult<T>> {
    const where = this.whereSql(1);
    const result = await getPool().query(`delete from ${assertIdentifier(this.table)}${where.sql}${this.returnSelection ? " returning *" : ""}`, where.values);
    const data = this.returnSelection ? await hydrateRows(this.table, result.rows, this.returnSelection) : null;
    return { data: data as T[] | null, error: null, count: result.rowCount };
  }
}

export const db = {
  from<T extends Record<string, unknown> = Record<string, unknown>>(table: string) {
    return new NativeQuery<T>(table);
  },
  async query<T = Record<string, unknown>>(text: string, values?: unknown[]) {
    return getPool().query(text, values) as Promise<{ rows: T[]; rowCount: number }>;
  },
  get pool() { return getPool(); },
};

function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function mapValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mapValue);
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) output[toCamel(key)] = mapValue(child);
    return output;
  }
  return value;
}

export function mapRow<T = any>(row: Record<string, unknown> | null | undefined): T | null {
  return row ? mapValue(row) as T : null;
}

export function mapRows<T = any>(rows: Record<string, unknown>[] | null | undefined): T[] {
  return rows ? rows.map((row) => mapRow<T>(row) as T) : [];
}
