# ADR-001: Headless Browser Scraping with Puppeteer

- **Status**: Accepted
- **Date**: 2026-11-22
- **Authors**: Digital Terrene Engineering
- **Deciders**: Repository Maintainers
- **Technical Story**: Core scraping engine selection (`scraper.js`)

---

## 1. Context & Problem Statement

Modern business websites frequently render contact information (email addresses, phone numbers, footer widgets) dynamically via client-side JavaScript frameworks (React, Vue, Angular) or obfuscation scripts. A static HTTP client (`fetch`/`axios`) paired with an HTML parser (`cheerio`) cannot execute client-side JavaScript and would miss dynamically injected contact details.

We needed a scraping engine capable of rendering full DOM trees while remaining straightforward to install and operate from a single Node.js script.

---

## 2. Decision

We will adopt **Puppeteer (`puppeteer` ^23.x)** driving headless Chromium as the core page rendering and DOM evaluation engine in [`scraper.js`](../../scraper.js).

Implementation Details:
- Launch a headless Chromium instance via `puppeteer.launch()` per target URL.
- Navigate to `${url}/contact` and `${url}/contact-us` using `waitUntil: "domcontentloaded"` and a `30000` ms timeout.
- Extract phone candidates from `page.content()` and email addresses via in-browser DOM evaluation (`page.evaluate()`).

---

## 3. Consequences

### Positive Impacts
- **JS-Rendered Page Support**: Executes client-side JavaScript and hydrates DOM nodes before extraction.
- **Full Browser Fidelity**: Handles redirects, cookies, and standard browser headers automatically.
- **Zero External Services**: Bundles a compatible Chromium binary via `npm install`, requiring no separate Selenium Grid or browser daemon.

### Negative Impacts & Operational Costs
- **Resource Footprint**: Headless Chromium consumes significantly more RAM and CPU than raw HTTP requests, especially because a new browser instance is launched per URL.
- **Install Size**: `npm install` downloads a multi-hundred-megabyte Chromium binary.
- **Throughput Ceiling**: Sequential browser launches limit batch velocity to a few domains per minute.

### Risks and Mitigations
- **Risk**: Orphaned Chromium processes if an uncaught exception occurs before `browser.close()`.
- **Mitigation**: Documented in [`docs/runbooks/troubleshooting-and-incident-response.md`](../runbooks/troubleshooting-and-incident-response.md); future refactor should move `browser.close()` into a `try/finally` block and reuse a single browser instance across URLs.

---

## 4. Alternatives Considered & Disqualification Rationale

### Option A: `axios` + `cheerio`
- *Pros*: Ultra-fast, tiny memory footprint, no binary download.
- *Cons*: Cannot execute JavaScript; fails on SPAs and dynamically hydrated contact pages.

### Option B: Playwright
- *Pros*: Multi-browser support (Chromium, Firefox, WebKit), strong auto-waiting ergonomics.
- *Cons*: Unnecessary multi-browser overhead for a single-purpose Chromium extraction script; Puppeteer offered a simpler minimal dependency footprint at initial authoring time.
