# Git Engineering Non-Negotiables & Repository Hygiene

To maintain a production-grade, maintainable codebase, all engineers and automated AI agents contributing to **Phone and Email Scraper** must adhere strictly to the following standards. **Pull requests violating these rules will be rejected.**

---

## 1. Clean Branching Strategy

All work must occur on isolated branches cut directly from the primary integration branch (`main`). Direct commits to `main` are discouraged outside emergency hotfixes.

**Naming Conventions:**
- Features: `feat/<scope>-<kebab-case-description>`
- Bug Fixes: `fix/<scope>-<kebab-case-description>`
- Refactoring: `refactor/<scope>-<kebab-case-description>`
- Documentation: `docs/<scope>-<kebab-case-description>`
- Maintenance: `chore/<scope>-<kebab-case-description>`

*Examples*:
- `feat/scraper-browser-instance-reuse`
- `fix/extractor-international-phone-regex`
- `docs/architecture-add-sequence-diagrams`
- `chore/deps-bump-puppeteer-v23`

---

## 2. Atomic Conventional Commits & Chain-of-Thought (CoT)

Every commit must be atomic (focused on a single logical change) and follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format:**
```text
<type>(<scope>): <short summary in imperative mood>

[Optional Body: Chain-of-Thought (CoT) explanation of Root Cause, Solution, and Proof]

[Optional Footer: BREAKING CHANGE, Closes #issue]
```

**Approved Types & Project Scopes:**

| Type | Intent | Example |
|---|---|---|
| `feat` | New capability or CLI option | `feat(scraper): support configurable contact sub-paths` |
| `fix` | Bug fix or error handling improvement | `fix(dns): handle malformed URLs before lookup` |
| `refactor` | Structural code change with identical behavior | `refactor(scraper): reuse single chromium instance across urls` |
| `perf` | Speed or memory optimization | `perf(puppeteer): block image and stylesheet requests` |
| `test` | Adding or updating automated tests | `test(extractor): add unit tests for email deduplication` |
| `docs` | Documentation, ADRs, diagrams, or runbooks | `docs(adr): record decision for append-mode csv output` |
| `style` | Formatting and whitespace only | `style(scrape): normalize quote and indentation style` |
| `chore` | Tooling, CI workflows, dependencies | `chore(ci): add gitleaks and syntax check workflow` |

### Chain-of-Thought (CoT) Commit Body Guidelines
For complex logic changes or AI-assisted commits, document:
1. **Root Cause**: Why the existing behavior was insufficient or broken.
2. **Technical Rationale**: Why the chosen approach was selected over alternatives.
3. **Verification Evidence**: Commands executed and observed results.

---

## 3. Pre-Commit Verification Gates

Before pushing or opening a PR, verify all local gates pass:

```text
[1. Secrets & PII Check] -> [2. Syntax Validation] -> [3. Hygiene Audit] -> [4. Smoke Test]
```

1. **Secrets & PII Check**: Inspect `git diff --cached` to confirm no `.env`, private keys, credentials, or scraped personal contact data in `data.csv` are staged.
2. **Syntax Validation**:
   ```bash
   npm run check
   # Runs: node --check scrape.js && node --check scraper.js && node --check urls.js && node --check server.js
   ```
3. **OpenAPI Spec Sync**: Whenever endpoints or payloads change in `server.js`, update [`docs/api/openapi.yaml`](./api/openapi.yaml) and [`docs/api/README.md`](./api/README.md) in the same commit so the live Swagger UI stays accurate.
4. **Hygiene Audit**:
   ```bash
   npm run audit:hygiene
   ```
5. **Tests (when added)**: `npm test` must exit with code `0`.

---

## 4. Credential, Secret & PII Protection

- **NEVER** commit `.env` files, API keys, private certificates (`*.pem`, `*.key`), or diagnostic logs (`*.log`).
- **NEVER** commit scraped contact records (emails, phone numbers) in `data.csv` to the repository.
- Maintain comprehensive exclusions in [`.gitignore`](../.gitignore).

---

## 5. Pull Request Completeness

Every PR must use [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) and include:
- **Problem Statement**: Linked issue or clear explanation of the need.
- **Technical Approach**: Summary of design decisions and trade-offs.
- **Proof of Verification**: Terminal output from syntax checks, audits, or test runs.
- **Breaking Changes**: Explicitly documented with migration steps if CLI, `urls.js`, or CSV schema changes.
