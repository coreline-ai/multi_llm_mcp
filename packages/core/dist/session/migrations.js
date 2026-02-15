export const SESSION_SCHEMA_VERSION = 9;
export const SESSION_MIGRATIONS = [
    {
        version: 9,
        sql: [
            "ALTER TABLE sessions ADD COLUMN thread_claude TEXT NULL;",
            "ALTER TABLE sessions ADD COLUMN thread_codex TEXT NULL;",
            "ALTER TABLE sessions ADD COLUMN thread_gemini TEXT NULL;",
            "ALTER TABLE sessions ADD COLUMN active_bridge TEXT NULL;",
            "ALTER TABLE events ADD COLUMN request_id TEXT NULL;",
            "ALTER TABLE events ADD COLUMN bridge TEXT NULL;",
            "ALTER TABLE events ADD COLUMN attempt_no INTEGER NULL;",
            "ALTER TABLE events ADD COLUMN fallback_from TEXT NULL;",
            "ALTER TABLE events ADD COLUMN error_code TEXT NULL;",
            "ALTER TABLE events ADD COLUMN routing_reason TEXT NULL;",
        ],
    },
];
export class InMemoryMigrator {
    apply(currentVersion) {
        const pending = SESSION_MIGRATIONS.filter((migration) => migration.version > currentVersion).sort((a, b) => a.version - b.version);
        return {
            targetVersion: pending.at(-1)?.version ?? currentVersion,
            statements: pending.flatMap((migration) => migration.sql),
        };
    }
}
//# sourceMappingURL=migrations.js.map