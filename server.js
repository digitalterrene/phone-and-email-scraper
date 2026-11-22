const express = require("express");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");
const {
  DEFAULT_PATHS,
  DEFAULT_TIMEOUT_MS,
  validateDomain,
  scrapeAndSaveData,
} = require("./scraper");

const PORT = Number(process.env.PORT) || 3000;
const CSV_OUTPUT_PATH = process.env.CSV_OUTPUT_PATH || path.join(__dirname, "data.csv");
const OPENAPI_SPEC_PATH = path.join(__dirname, "docs", "api", "openapi.yaml");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Load OpenAPI specification (single source of truth for Swagger UI)
const openapiRawYaml = fs.readFileSync(OPENAPI_SPEC_PATH, "utf8");
const openapiDocument = yaml.load(openapiRawYaml);

/**
 * Minimal RFC-4180-aware CSV line parser for 3-column scraper rows
 * (Page URL, Phone Numbers, Emails).
 */
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function readCsvResults(csvPath) {
  if (!fs.existsSync(csvPath)) {
    return [];
  }
  const content = fs.readFileSync(csvPath, "utf8").trim();
  if (!content) {
    return [];
  }

  const lines = content.split(/\r?\n/).filter(Boolean);
  const records = [];

  for (const line of lines) {
    const [pageUrl = "", phonesRaw = "", emailsRaw = ""] = parseCsvLine(line);
    // Skip optional header line if operator seeded one
    if (pageUrl === "Page URL" && phonesRaw === "Phone Numbers") {
      continue;
    }
    records.push({
      pageUrl,
      phoneNumbers: phonesRaw ? phonesRaw.split(",").filter(Boolean) : [],
      emails: emailsRaw ? emailsRaw.split(",").filter(Boolean) : [],
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Interactive API Documentation (Swagger UI — no Postman/Thunder Client needed)
// ---------------------------------------------------------------------------
app.get("/", (_req, res) => {
  res.redirect("/docs");
});

app.get("/docs/openapi.json", (_req, res) => {
  res.json(openapiDocument);
});

app.get("/docs/openapi.yaml", (_req, res) => {
  res.type("text/yaml").send(openapiRawYaml);
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customSiteTitle: "Phone & Email Scraper — Interactive API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  })
);

// ---------------------------------------------------------------------------
// REST API Endpoints
// ---------------------------------------------------------------------------

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "phone-and-email-scraper",
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    defaults: {
      paths: DEFAULT_PATHS,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    },
    timestamp: new Date().toISOString(),
  });
});

// 2. DNS & URL pre-flight validation
app.post("/api/validate-domain", async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({
      error: "Bad Request",
      message: "Request body must include a non-empty string field 'url'.",
    });
  }

  const result = await validateDomain(url);
  return res.status(200).json(result);
});

// 3. Scrape a single base URL
app.post("/api/scrape", async (req, res, next) => {
  try {
    const { url, paths, timeout, saveToCsv = true } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Request body must include a non-empty string field 'url'.",
      });
    }

    if (paths !== undefined && (!Array.isArray(paths) || paths.some((p) => typeof p !== "string"))) {
      return res.status(400).json({
        error: "Bad Request",
        message: "'paths' must be an array of route strings (e.g. [\"/contact\", \"/about\"]).",
      });
    }

    if (timeout !== undefined && (typeof timeout !== "number" || timeout < 1000 || timeout > 120000)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "'timeout' must be a number between 1000 and 120000 milliseconds.",
      });
    }

    const validation = await validateDomain(url);
    if (!validation.valid) {
      return res.status(422).json({
        error: "Unprocessable Entity",
        message: validation.error,
        url: validation.url,
        hostname: validation.hostname || null,
      });
    }

    const output = await scrapeAndSaveData(validation.url, CSV_OUTPUT_PATH, {
      paths,
      timeout,
      saveToCsv: Boolean(saveToCsv),
    });

    return res.status(200).json(output);
  } catch (error) {
    return next(error);
  }
});

// 4. Scrape a batch of URLs sequentially
app.post("/api/scrape/batch", async (req, res, next) => {
  try {
    const { urls, paths, timeout, saveToCsv = true } = req.body || {};

    if (!Array.isArray(urls) || urls.length === 0 || urls.some((u) => typeof u !== "string")) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Request body must include a non-empty string array field 'urls'.",
      });
    }

    const items = [];
    let succeeded = 0;
    let skipped = 0;
    let failed = 0;

    for (const rawUrl of urls) {
      const validation = await validateDomain(rawUrl);
      if (!validation.valid) {
        skipped += 1;
        items.push({
          url: rawUrl.trim(),
          status: "skipped",
          reason: validation.error,
          results: [],
        });
        continue;
      }

      try {
        const output = await scrapeAndSaveData(validation.url, CSV_OUTPUT_PATH, {
          paths,
          timeout,
          saveToCsv: Boolean(saveToCsv),
        });
        succeeded += 1;
        items.push({
          url: output.url,
          status: "completed",
          scrapedAt: output.scrapedAt,
          results: output.results,
        });
      } catch (error) {
        failed += 1;
        items.push({
          url: validation.url,
          status: "failed",
          reason: error.message,
          results: [],
        });
      }
    }

    return res.status(200).json({
      total: urls.length,
      succeeded,
      skipped,
      failed,
      savedToCsv: Boolean(saveToCsv),
      items,
    });
  } catch (error) {
    return next(error);
  }
});

// 5. Retrieve saved CSV results (JSON or raw CSV download)
app.get("/api/results", (req, res) => {
  if (req.query.format === "csv") {
    const raw = fs.existsSync(CSV_OUTPUT_PATH) ? fs.readFileSync(CSV_OUTPUT_PATH, "utf8") : "";
    res.setHeader("Content-Disposition", 'attachment; filename="data.csv"');
    return res.type("text/csv").send(raw);
  }

  const records = readCsvResults(CSV_OUTPUT_PATH);
  return res.status(200).json({
    count: records.length,
    file: path.basename(CSV_OUTPUT_PATH),
    records,
  });
});

// 6. Clear saved CSV results
app.delete("/api/results", (_req, res) => {
  fs.writeFileSync(CSV_OUTPUT_PATH, "", "utf8");
  return res.status(200).json({
    cleared: true,
    file: path.basename(CSV_OUTPUT_PATH),
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred.",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Phone & Email Scraper API listening on http://localhost:${PORT}`);
    console.log(`Interactive Swagger UI docs available at http://localhost:${PORT}/docs`);
  });
}

module.exports = { app };
