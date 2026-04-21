# Technical Debt

Known items deferred to future work. Each entry lists cost, risk, and the trigger condition that justifies addressing it.

---

## DB schema: physical table name `predictions`

**Current state:** The IndexedDB table is physically named `predictions` (historic). TypeScript accesses it via the `db.patternSummaries` accessor, bound in `src/lib/db.ts` constructor via `this.patternSummaries = this.table('predictions')`.

**Why the alias (rather than a full rename):** Renaming the physical table requires a Dexie version migration that touches every live user's IndexedDB. Migration bugs risk data loss for cancer patients — unacceptable without a strong reason.

**What full rename would require:**

1. `db.version(N+1).stores({ patternSummaries: '++id, date, ...', predictions: null }).upgrade(async tx => { /* copy all rows */ })`
2. Data migration code that preserves all existing user records (indexes, constraints)
3. Tests with populated test DB verifying zero data loss
4. Breaking-change note in CHANGELOG — existing users will see DB version bump on next app open
5. Rollback plan if migration fails on production devices

**Scheduled for:** next major version (v2.0), or when an independent reason already requires a Dexie schema change (batching multiple migrations is cheaper than single-purpose).

**Owner:** Dominik Gaweł

---

## JSON export/import format key `predictions`

The export format (`exportAllData()` in `src/lib/db.ts`) uses the JSON key `predictions` for backward compatibility with user-created backup files. If a user exported data under the old naming, their backup should still import correctly.

**What full rename would require:** version the export format, add backward-compat loader that accepts both `predictions` and `patternSummaries` keys, deprecate old key in major version.

**Scheduled for:** alongside the physical table migration (v2.0).

---

## Hardcoded PL string in `useChat.ts:85`

```ts
responseText += `\n\n🎯 **Trafność poprzednich analiz wzorców:** ${accuracyCheck.overallAccuracy}%`;
```

Skipped `translations/pl.ts` system. Tagged with `// TODO:` comment in-file.

**Scheduled for:** next UI i18n pass.
