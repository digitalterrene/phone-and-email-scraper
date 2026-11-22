# ADR-002: DNS Pre-Flight Validation & Fault Isolation

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Repository Maintainers
- **Technical Story**: Batch resilience and fast-fail domain filtering (`scrape.js`, `scraper.js`)

---

## 1. Context & Problem Statement

Input URL lists in [`urls.js`](../../urls.js) frequently contain dead domains, typos, whitespace, or unreachable hosts. Launching headless Chromium and waiting for a 30-second navigation timeout on every invalid domain wastes substantial time and memory. Furthermore, an unhandled navigation or network exception on one URL would terminate the entire Node.js process and abort all remaining URLs in the batch.

---

## 2. Decision

We will implement a **two-layer resilience strategy** combining DNS pre-flight validation in [`scrape.js`](../../scrape.js) with nested `try/catch` fault isolation across both URL and sub-page loops.

Implementation Details:
- Before calling `scrapeAndSaveData`, trim each URL and validate its hostname with `new URL(url).hostname` and `dns.promises.lookup(domain)`.
- Skip unresolvable or malformed URLs immediately without launching Chromium.
- Wrap each URL invocation in `scrape.js` and each `page.goto()` call in `scraper.js` inside independent `try/catch` blocks that log the error and continue iteration.

---

## 3. Consequences

### Positive Impacts
- **Fast-Fail Performance**: Dead domains fail in milliseconds via OS DNS resolution instead of spinning up Chromium for 30+ seconds.
- **Batch Continuity**: One broken domain, TLS error, or page timeout never aborts the rest of the run.
- **Zero Extra Dependencies**: Uses Node.js built-in `dns.promises` and `URL`.

### Negative Impacts & Operational Costs
- **Silent Partial Failures**: Errors are logged to `stderr` rather than written to a structured dead-letter CSV/JSON report, making post-run retry of failed URLs manual.
- **DNS-Only Guarantee**: A domain that resolves in DNS may still refuse TCP connections, return HTTP 404/500, or block headless browsers.

### Risks and Mitigations
- **Risk**: Transient local DNS hiccups could cause valid domains to be skipped.
- **Mitigation**: Operators can review console logs and re-run skipped URLs; future enhancements may add configurable retries and a failed-URLs report file.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: Let Puppeteer Handle All Resolution Failures
- *Pros*: Slightly simpler code in `scrape.js`.
- *Cons*: Launches an entire Chromium process just to fail with `net::ERR_NAME_NOT_RESOLVED`, wasting CPU, RAM, and wall-clock time.

### Option B: HTTP `HEAD` Pre-Flight Check Before Puppeteer
- *Pros*: Detects HTTP 404/500 before launching Chromium.
- *Cons*: Many websites block or mishandle `HEAD` requests or non-browser user agents, producing false negatives on valid contact pages.
