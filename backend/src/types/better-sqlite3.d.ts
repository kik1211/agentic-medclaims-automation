declare module 'better-sqlite3' {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement<BindParameters extends unknown[] = unknown[], Result = unknown> {
    run(...params: BindParameters): RunResult;
    get(...params: BindParameters): Result | undefined;
    all(...params: BindParameters): Result[];
    iterate(...params: BindParameters): IterableIterator<Result>;
    pluck(toggleState?: boolean): this;
    expand(toggleState?: boolean): this;
    raw(toggleState?: boolean): this;
    bind(...params: BindParameters): this;
  }

  export interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: ((message?: unknown, ...additionalArgs: unknown[]) => void) | null;
    nativeBinding?: string;
  }

  export class Database {
    constructor(filename?: string | Buffer, options?: DatabaseOptions);
    memory: boolean;
    readonly: boolean;
    name: string;
    open: boolean;
    inTransaction: boolean;

    prepare<BindParameters extends unknown[] = unknown[], Result = unknown>(
      sql: string
    ): Statement<BindParameters, Result>;
    transaction<F extends (...args: unknown[]) => unknown>(fn: F): F;
    exec(sql: string): this;
    pragma(pragma: string, options?: { simple?: boolean }): unknown;
    checkpoint(databaseName?: string): this;
    close(): this;
    defaultSafeIntegers(toggleState?: boolean): this;
  }

  export default Database;
}
