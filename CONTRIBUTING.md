# Contributing to Phone and Email Scraper

Thank you for your interest in contributing to **Phone and Email Scraper**. Maintaining a reliable, maintainable, and secure codebase requires clear engineering standards across both human contributors and AI-assisted workflows.

---

## 1. Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors regardless of experience level, background, or identity. Please treat everyone with respect and professional empathy.

---

## 2. Engineering Non-Negotiables

Before opening a Pull Request, you **must** read and understand our [Git Engineering Standards](./docs/git-standards.md).

**Key Rules:**
1. **Branch Naming**: Branch from `main` using `feat/<scope>-<desc>`, `fix/<scope>-<desc>`, `refactor/<scope>-<desc>`, `docs/<scope>-<desc>`, or `chore/<scope>-<desc>`.
2. **Conventional Commits**: Every commit must strictly adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification.
3. **Chain-of-Thought (CoT)**: For non-trivial changes or agentic pair-programming, record the root cause, rationale, and verification proof in the commit body.
4. **Pre-Commit Verification**: Your PR must pass syntax checks (`node --check`), pass repository hygiene audits, contain zero leaked secrets or scraped PII in `data.csv`, and include proof of verification.

---

## 3. Local Development Workflow

1. Fork or clone the repository:
   ```bash
   git clone https://github.com/digitalterrene/phone-and-email-scraper.git
   cd phone-and-email-scraper
   ```
2. Create an isolated branch from `main`:
   ```bash
   git checkout -b feat/scraper-configurable-paths
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Make atomic, well-scoped changes. Keep `urls.js` free of private/internal target URLs and ensure `data.csv` is not committed with scraped PII.
5. Verify quality gates locally:
   ```bash
   # Syntax verification across CLI and API modules
   npm run check

   # Repository hygiene audit
   npm run audit:hygiene

   # Inspect staged diff for secrets or accidental PII dumps
   git diff --cached
   ```
6. If you modify any HTTP endpoints or request/response schemas in [`server.js`](./server.js), update [`docs/api/openapi.yaml`](./docs/api/openapi.yaml) and [`docs/api/README.md`](./docs/api/README.md) so the live Swagger UI (`/docs`) remains the single source of truth.

---

## 4. Architectural Modifications & ADRs

If your contribution changes core system boundaries — such as switching scraping engines, introducing concurrency/queues, changing persistence from CSV to a database, or altering CLI contracts:
1. Review our [Architecture Blueprints](./docs/architecture/).
2. Submit an **Architecture Decision Record (ADR)** in [`docs/adr/`](./docs/adr/) using [`ADR-000-template.md`](./docs/adr/ADR-000-template.md) and update [`docs/adr/README.md`](./docs/adr/README.md).
3. Update affected architecture diagrams and operational runbooks in the same PR.

---

## 5. Submitting a Pull Request

1. Rebase your branch against the latest `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```
2. Push your branch and open a PR using our [Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md).
3. Ensure all automated CI checks in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) pass.
4. Address review feedback with clean, atomic commits.
