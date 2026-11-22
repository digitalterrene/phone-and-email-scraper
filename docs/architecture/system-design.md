# System Design & Component Topology

*Status*: Living Architecture Specification  
*Last Updated*: 2026-11-22

## 1. Overview

**Phone and Email Scraper** supports two execution surfaces over a shared scraping and validation core ([`scraper.js`](../../scraper.js)):

1. **CLI Batch Mode** ([`scrape.js`](../../scrape.js)): Reads a static list of URLs from [`urls.js`](../../urls.js) and scrapes them sequentially.
2. **REST API & Live Interactive Docs Mode** ([`server.js`](../../server.js)): Exposes HTTP endpoints via Express and serves an interactive **Swagger UI** playground at `GET /docs` directly from [`docs/api/openapi.yaml`](../api/openapi.yaml) so developers can test endpoints live without Postman or Thunder Client.

Both modes share pre-flight URL/DNS validation (`validateDomain`), headless Chromium extraction (`scrapeAndSaveData`), and append-mode CSV persistence (`data.csv`).

---

## 2. Component Topology

```mermaid
flowchart TD
    subgraph Clients["Operator & Developer Interfaces"]
        CLIUser["CLI Operator<br/>(node scrape.js)"]
        BrowserDev["Developer Browser<br/>(http://localhost:3000/docs)"]
        HTTPClient["HTTP / curl Client"]
    end

    subgraph AppLayer["Application Layer (Node.js Process)"]
        Urls["urls.js<br/>(Static Target List)"]
        CLI["scrape.js<br/>(CLI Batch Runner)"]
        API["server.js<br/>(Express REST API)"]
        Swagger["swagger-ui-express<br/>(Live Docs at /docs)"]
        OpenAPI["docs/api/openapi.yaml<br/>(Single Source of Truth)"]
    end

    subgraph CoreEngine["Shared Core (scraper.js)"]
        Validator["validateDomain(url)<br/>(http/https + dns.promises.lookup)"]
        Extractor["scrapeAndSaveData(url, csvFile, options)<br/>(Lazy Puppeteer + try/finally cleanup)"]
        CsvWriter["csv-writer<br/>(Append-Only Persistence)"]
        CsvFile[("data.csv")]
    end

    subgraph BrowserRuntime["Child Process (Per-URL Lifecycle)"]
        Chromium["Headless Chromium<br/>(Managed by Puppeteer)"]
        DOM["Page DOM Context<br/>(page.content / page.evaluate)"]
    end

    subgraph ExternalNet["External Network"]
        DNSResolver["OS / Upstream DNS Resolver"]
        TargetSite["Target Web Server<br/>(/contact, /contact-us, custom paths)"]
    end

    CLIUser --> CLI
    Urls --> CLI
    BrowserDev -- "GET /docs" --> Swagger
    OpenAPI -- "Loaded at boot (js-yaml)" --> Swagger
    Swagger -- "Try It Out (Live HTTP)" --> API
    HTTPClient --> API

    CLI --> Validator
    CLI --> Extractor
    API --> Validator
    API --> Extractor
    API -- "GET / DELETE /api/results" --> CsvFile

    Validator -- "DNS A/AAAA lookup" --> DNSResolver
    Extractor -- "puppeteer.launch()" --> Chromium
    Chromium -- "HTTP/HTTPS GET" --> TargetSite
    TargetSite -- "HTML + JS Execution" --> DOM
    DOM -- "phoneNumbers[] & emails[]" --> Extractor
    Extractor -- "saveToCsv !== false" --> CsvWriter
    CsvWriter --> CsvFile
```

---

## 3. End-to-End Execution Sequence

The sequence below covers both CLI batch execution and live Swagger UI / REST API execution:

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Operator / Swagger UI
    participant Entry as scrape.js or server.js
    participant DNS as validateDomain()
    participant Scraper as scrapeAndSaveData()
    participant Browser as Headless Chromium
    participant Site as Target Website
    participant CSV as data.csv

    Caller->>Entry: Run CLI or POST /api/scrape
    Entry->>DNS: validateDomain(url)
    alt Malformed URL, non-HTTP(S), or DNS failure
        DNS-->>Entry: { valid: false, error }
        Entry-->>Caller: Skip URL (CLI) or HTTP 422 (API)
    else Domain resolvable
        DNS-->>Entry: { valid: true, url, hostname, address }
        Entry->>Scraper: scrapeAndSaveData(url, csvFile, options)
        Scraper->>Browser: Lazy-load puppeteer & launch()
        loop For each sub-path (default: /contact, /contact-us)
            Scraper->>Browser: page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout })
            Browser->>Site: HTTP/HTTPS GET
            alt Navigation succeeds
                Site-->>Browser: HTML Document
                Scraper->>Browser: page.content() -> match(/\d{10,}/g)
                Scraper->>Browser: page.evaluate() -> extract emails from p, li, div
                opt saveToCsv is true
                    Scraper->>CSV: csvWriter.writeRecords([data])
                end
            else Timeout / Network Error
                Site-->>Browser: Error / Timeout
                Scraper->>Scraper: Record page error & continue loop
            end
        end
        Scraper->>Browser: browser.close() (guaranteed in try/finally)
        Scraper-->>Entry: { url, scrapedAt, savedToCsv, results[] }
        Entry-->>Caller: Log completion (CLI) or HTTP 200 JSON (API)
    end
```

---

## 4. Module Boundaries & Contracts

| Module | Role | Exports / Entry Point | Dependencies |
|---|---|---|---|
| [`server.js`](../../server.js) | Express REST API & live Swagger UI server (`/docs`) | `{ app }` + self-listening CLI (`npm start`) | `express`, `swagger-ui-express`, `js-yaml`, `./scraper`, `docs/api/openapi.yaml` |
| [`scrape.js`](../../scrape.js) | CLI batch orchestrator | Self-executing CLI (`npm run scrape` / `node scrape.js`) | `./scraper`, `./urls` |
| [`scraper.js`](../../scraper.js) | Shared DNS validator, Puppeteer controller & CSV writer | `{ DEFAULT_PATHS, DEFAULT_TIMEOUT_MS, validateDomain, scrapeAndSaveData }` | `puppeteer` (lazy-loaded), `csv-writer`, `dns.promises` |
| [`urls.js`](../../urls.js) | Static input configuration for CLI mode | `{ urls: string[] }` | None |
| [`docs/api/openapi.yaml`](../api/openapi.yaml) | Single-source-of-truth OpenAPI 3.0.3 contract | Loaded by `server.js` into Swagger UI | None |

### Internal Function Contracts

- **`validateDomain(rawUrl: string)`** (`scraper.js`):
  - Enforces non-empty string, valid WHATWG `URL`, and `http:` / `https:` protocol only.
  - Resolves hostname via `dns.promises.lookup` and returns `{ valid, url, hostname?, address?, error? }`.
- **`scrapeAndSaveData(url, csvFile = "data.csv", options = {})`** (`scraper.js`):
  - Supports `{ paths?: string[], timeout?: number, saveToCsv?: boolean }`.
  - Lazy-loads `puppeteer` on first scrape call so non-scraping API endpoints (`/api/health`, `/api/validate-domain`, `/api/results`, `/docs`) start instantly.
  - Guarantees `await browser.close()` inside a `try/finally` block and returns structured per-page extraction results.

---

## 5. Fault Isolation & Error State Model

```mermaid
stateDiagram-v2
    [*] --> InputValidation
    InputValidation --> RejectedRequest: Missing/Invalid Fields (HTTP 400)
    InputValidation --> DNSValidation: Payload Valid
    DNSValidation --> SkippedOr422: Invalid Scheme / ENOTFOUND
    DNSValidation --> BrowserLaunch: DNS Resolved
    BrowserLaunch --> PageNavigation: Chromium Ready
    BrowserLaunch --> URLFailed: Launch Error
    PageNavigation --> Extraction: DOMContentLoaded (< timeout)
    PageNavigation --> PageFailed: Timeout / Network Error
    Extraction --> CSVAppend: saveToCsv = true
    Extraction --> NextPage: saveToCsv = false (Dry Run)
    CSVAppend --> NextPage: Row Persisted
    PageFailed --> NextPage: Error Recorded
    NextPage --> PageNavigation: More Sub-paths
    NextPage --> BrowserClose: All Sub-paths Done (finally)
    BrowserClose --> Completed
    SkippedOr422 --> [*]
    URLFailed --> [*]
    RejectedRequest --> [*]
    Completed --> [*]
```

### Scaling Characteristics
- **Per-URL Browser Lifecycle**: Launching and closing Chromium per URL maximizes session/cookie isolation between sites at the cost of higher CPU/RAM overhead on large batches.
- **Synchronous HTTP Batch Execution**: `POST /api/scrape/batch` processes URLs sequentially within the HTTP request lifecycle; for very large batches in production, an asynchronous job queue should be introduced via a future ADR.
