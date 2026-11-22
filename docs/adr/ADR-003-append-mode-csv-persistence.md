# ADR-003: Append-Mode CSV Persistence via `csv-writer`

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Repository Maintainers
- **Technical Story**: Incremental output persistence (`scraper.js`, `data.csv`)

---

## 1. Context & Problem Statement

Scraping dozens or hundreds of websites sequentially can take minutes to hours and is vulnerable to manual interruption (`Ctrl+C`), OS kills, or Chromium crashes. Holding all scraped results in memory until the end of the batch risks losing all collected data on an unexpected termination. At the same time, operators need a universally portable output format that opens directly in Excel, Google Sheets, pandas, or CRM importers without provisioning a database.

---

## 2. Decision

We will persist extracted records incrementally to a local CSV file (`data.csv`) using **`csv-writer` (`createObjectCsvWriter`) configured with `append: true`** after each successfully scraped page.

Implementation Details:
- Define a 3-column schema: `Page URL` (`pageUrl`), `Phone Numbers` (`phoneNumbers`), and `Emails` (`emails`).
- Flush each single-page record immediately via `await csvWriter.writeRecords([data])`.

---

## 3. Consequences

### Positive Impacts
- **Crash Resilience**: Every scraped page is durably written to disk immediately; interrupting the script preserves all prior progress.
- **Universal Portability**: CSV integrates directly with spreadsheets, BI tools, and ETL pipelines with zero database setup.
- **Proper Escaping**: `csv-writer` automatically quotes fields containing commas (such as multi-value phone/email arrays).

### Negative Impacts & Operational Costs
- **Missing Header Row on Fresh Files**: With `append: true`, `csv-writer` does not write the header row even when `data.csv` is empty.
- **No Built-in Deduplication Across Runs**: Re-running the scraper against the same `urls.js` appends duplicate rows to `data.csv`.
- **Repeated Writer Instantiation**: `createCsvWriter(...)` is constructed on every page iteration rather than initialized once per batch.

### Risks and Mitigations
- **Risk**: Accidental commit of `data.csv` containing scraped PII to Git.
- **Mitigation**: Automated CI check in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) rejects PRs with a non-empty `data.csv`, and [`CONTRIBUTING.md`](../../CONTRIBUTING.md) prohibits staging scraped outputs.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: In-Memory Aggregation + Single JSON/CSV Write at Exit
- *Pros*: Clean header handling and global deduplication across all URLs.
- *Cons*: Complete data loss if the process crashes or is cancelled mid-batch.

### Option B: SQLite Database (`better-sqlite3` / `sqlite3`)
- *Pros*: ACID transactions, upserts, queryability, and native deduplication.
- *Cons*: Adds native C++ build dependencies (prone to Windows build friction) and requires an extra export step for spreadsheet users.
