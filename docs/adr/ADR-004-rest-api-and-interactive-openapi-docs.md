# ADR-004: Express REST API with Built-In Interactive OpenAPI (Swagger UI) Documentation

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Repository Maintainers
- **Technical Story**: Expose scraper over HTTP with zero-tool interactive API testing (`server.js`, `docs/api/openapi.yaml`)

---

## 1. Context & Problem Statement

Previously, **Phone and Email Scraper** could only be invoked by manually editing [`urls.js`](../../urls.js) and running `node scrape.js`. While effective for static batch runs, developers and integrators lacked:
1. A programmatic HTTP interface to validate domains, trigger single or batch scrapes, and retrieve results.
2. An interactive way to explore and test endpoints directly in the browser without installing external REST clients such as Postman or Thunder Client.

---

## 2. Decision

We will introduce a lightweight **Express (`server.js`) REST API** wrapping the shared [`scraper.js`](../../scraper.js) module, paired with a **single-source-of-truth OpenAPI 3.0.3 specification ([`docs/api/openapi.yaml`](../api/openapi.yaml))** rendered interactively via **`swagger-ui-express` at `GET /docs`**.

Implementation Details:
- Keep [`scrape.js`](../../scrape.js) 100% backwards-compatible as a standalone CLI entry point.
- Load `docs/api/openapi.yaml` at server startup via `js-yaml` so Swagger UI and the documented contract can never drift out of sync.
- Enable `tryItOutEnabled: true` and `displayRequestDuration: true` in Swagger UI for instant in-browser endpoint testing.
- Expose raw specifications at `/docs/openapi.json` and `/docs/openapi.yaml` for client SDK generation or external tooling.

---

## 3. Consequences

### Positive Impacts
- **Superior Developer Experience**: Engineers can test `/api/health`, `/api/validate-domain`, `/api/scrape`, `/api/scrape/batch`, and `/api/results` directly at `http://localhost:3000/docs` with zero external tools.
- **Single Source of Truth**: Both human walkthroughs and Swagger UI consume `docs/api/openapi.yaml`.
- **Dry-Run Support**: API callers can pass `saveToCsv: false` to test extraction without mutating `data.csv`.

### Negative Impacts & Operational Costs
- **Additional Dependencies**: Adds `express`, `swagger-ui-express`, and `js-yaml` to `package.json`.
- **Long-Running HTTP Requests**: Synchronous `/api/scrape/batch` requests hold the HTTP connection open while Puppeteer navigates each URL.

### Risks and Mitigations
- **Risk**: Exposing `/api/scrape` on a public network interface could be abused for SSRF or resource exhaustion.
- **Mitigation**: Designed for local/internal development (`localhost:3000`) with strict `http://`/`https://` protocol validation and timeout bounds (`1000–120000` ms). Production public deployment would require authentication, rate limiting, private-IP blocking, and async job queues.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Postman / Thunder Client Collection Files in Repo
- *Pros*: Zero runtime dependencies.
- *Cons*: Forces every developer to install third-party extensions/apps and manually import/sync collections whenever endpoints change.

### Option B: Fastify + `@fastify/swagger`
- *Pros*: High throughput and schema-first JSON validation.
- *Cons*: Express + `swagger-ui-express` has lower cognitive overhead for a small CommonJS Node.js utility and loads standard OpenAPI YAML files directly with minimal boilerplate.
