## 📌 Summary of Changes

A concise, high-level overview of what this pull request changes and why.

---

## 🎯 Problem Statement & Context

What bug does this fix, or what feature/documentation improvement does this implement?
Fixes # (issue)

---

## 🛠️ Technical Approach & Implementation Details

Explain the architectural or implementation strategy. Note any regex changes, Puppeteer lifecycle adjustments, CSV schema impacts, or trade-offs:
- [ ] Point 1
- [ ] Point 2

---

## 🧪 Proof of Verification (Non-Negotiable)

Provide concrete evidence that this change functions properly and introduces no regressions:

### Syntax, Tests & Hygiene Audit Output:
```text
# Example:
# node --check scrape.js && node --check scraper.js && node --check urls.js
# node .agents/skills/senior-repo-standards/scripts/audit-hygiene.js
```

---

## ⚠️ Breaking Changes

- [ ] **No breaking changes** introduced.
- [ ] **Breaking change**: Describe backwards-incompatible changes to `urls.js`, CLI execution, or `data.csv` schema below.

---

## ✅ Senior Pre-Flight Checklist

- [ ] My code adheres to the repository's [Git Standards](./docs/git-standards.md).
- [ ] Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- [ ] Complex changes include Chain-of-Thought reasoning in commit bodies.
- [ ] Syntax checks pass with 0 errors (`npm run check`).
- [ ] Repository hygiene audit passes (`npm run audit:hygiene`).
- [ ] Staged diff verified to contain **NO secrets**, credentials, diagnostic logs, or scraped PII in `data.csv`.
- [ ] Relevant documentation (`README.md`, `docs/api/openapi.yaml`, `docs/api/README.md`, `docs/architecture/`, `docs/adr/`, `docs/runbooks/`) has been updated.
