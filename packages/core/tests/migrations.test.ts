import { describe, expect, it } from "vitest";

import { InMemoryMigrator, SESSION_SCHEMA_VERSION } from "../src/session/migrations.js";

describe("session migrations", () => {
  it("exposes schema version 9", () => {
    expect(SESSION_SCHEMA_VERSION).toBe(9);
  });

  it("returns migration statements from lower versions", () => {
    const migrator = new InMemoryMigrator();
    const plan = migrator.apply(8);

    expect(plan.targetVersion).toBe(9);
    expect(plan.statements.length).toBeGreaterThan(0);
  });
});
