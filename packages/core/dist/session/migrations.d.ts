export declare const SESSION_SCHEMA_VERSION = 9;
export interface Migration {
    version: number;
    sql: string[];
}
export declare const SESSION_MIGRATIONS: Migration[];
export declare class InMemoryMigrator {
    apply(currentVersion: number): {
        targetVersion: number;
        statements: string[];
    };
}
//# sourceMappingURL=migrations.d.ts.map