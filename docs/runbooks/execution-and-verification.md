# Execution & Verification Runbook

*Tier 4 Operational Runbook*  
*Last Updated*: 2026-11-22

This runbook provides step-by-step procedures to verify the local environment, execute a controlled smoke test, validate CSV output, and confirm repository hygiene before committing changes.

---

## 1. Pre-Flight Environment Checklist

Run the following commands from the repository root:

```bash
# 1. Confirm Node.js version (>= 16.x recommended, 20.x LTS used in CI)
node -v

# 2. Confirm dependencies and Chromium binary are installed
npm install

# 3. Verify JavaScript syntax across all source modules
node --check scrape.js && node --check scraper.js && node --check urls.js && node --check server.js
```

Expected result: all commands exit with code `0` and zero syntax errors.

---

## 2. REST API & Interactive Swagger UI Smoke Test

1. Start the Express API server:
   ```bash
   npm start
   ```
2. Open [http://localhost:3000/docs](http://localhost:3000/docs) in your browser (or probe via `curl`):
   ```bash
   curl http://localhost:3000/api/health
   curl -X POST http://localhost:3000/api/validate-domain \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}'
   ```
3. Use Swagger UI's **Try it out -> Execute** on `POST /api/scrape` with `"saveToCsv": false` for a clean dry-run verification without mutating `data.csv`.

---

## 3. Controlled CLI Smoke Test

1. Confirm [`urls.js`](../../urls.js) contains safe test URLs (default is `https://example.com`).
2. Back up or clear `data.csv` if starting a fresh run. Optionally seed the CSV header row:
   ```bash
   echo "Page URL,Phone Numbers,Emails" > data.csv
   ```
3. Execute the scraper:
   ```bash
   node scrape.js
   ```
4. Observe expected stdout progression:
   ```text
   Starting scrape for the following URLs: [ 'https://example.com', ... ]
   Scraping data from: https://example.com
   Navigating to: https://example.com/contact
   Scraped data successfully for: https://example.com/contact
   Navigating to: https://example.com/contact-us
   Scraped data successfully for: https://example.com/contact-us
   Finished scraping for: https://example.com
   Scraping completed.
   ```
5. Inspect generated records in `data.csv`:
   ```bash
   # Linux / macOS
   head -n 10 data.csv

   # Windows PowerShell
   Get-Content data.csv -TotalCount 10
   ```

---

## 3. Post-Run Cleanup (Before Git Commit)

> [!WARNING]
> Never commit scraped contact information (PII) in `data.csv` to version control.

Reset `data.csv` to its clean tracked state before committing:

```bash
git checkout -- data.csv
```

---

## 4. Repository Hygiene Verification

Before opening a Pull Request, run the Senior Repository Standards audit:

```bash
node .agents/skills/senior-repo-standards/scripts/audit-hygiene.js
```

Confirm:
- `.gitignore` security checks pass (30/30 pts).
- Tier 1–4 documentation and GitHub templates are present.
- `git diff --cached` contains no `.env`, credentials, logs, or scraped PII.
