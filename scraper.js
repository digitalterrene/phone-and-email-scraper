const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dns = require("dns").promises;

let puppeteerModule;
function getPuppeteer() {
  if (!puppeteerModule) {
    puppeteerModule = require("puppeteer");
  }
  return puppeteerModule;
}

const DEFAULT_PATHS = ["/contact", "/contact-us"];
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Validates URL syntax (http/https only) and checks DNS resolvability.
 * @param {string} rawUrl
 * @returns {Promise<{ valid: boolean, url: string, hostname?: string, address?: string, error?: string }>}
 */
async function validateDomain(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { valid: false, url: rawUrl || "", error: "URL must be a non-empty string." };
  }

  const trimmedUrl = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    return { valid: false, url: trimmedUrl, error: "Invalid URL format. Include http:// or https://." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, url: trimmedUrl, error: "Only http:// and https:// protocols are supported." };
  }

  try {
    const result = await dns.lookup(parsed.hostname);
    return {
      valid: true,
      url: trimmedUrl.replace(/\/+$/, ""),
      hostname: parsed.hostname,
      address: result.address,
    };
  } catch (error) {
    return {
      valid: false,
      url: trimmedUrl,
      hostname: parsed.hostname,
      error: `DNS lookup failed for ${parsed.hostname}: ${error.code || error.message}`,
    };
  }
}

/**
 * Scrapes phone numbers and email addresses from contact pages of a base URL
 * and optionally appends each page's results to a CSV file.
 *
 * @param {string} url Base website URL (e.g. "https://example.com")
 * @param {string} [csvFile="data.csv"] Path to output CSV file
 * @param {object} [options] Optional scraper overrides
 * @param {string[]} [options.paths] Sub-paths to visit (default: ["/contact", "/contact-us"])
 * @param {number} [options.timeout] Navigation timeout in ms (default: 30000)
 * @param {boolean} [options.saveToCsv] Whether to append results to csvFile (default: true)
 * @returns {Promise<{ url: string, scrapedAt: string, savedToCsv: boolean, csvFile: string|null, results: Array<object> }>}
 */
async function scrapeAndSaveData(url, csvFile = "data.csv", options = {}) {
  const normalizedBase = url.trim().replace(/\/+$/, "");
  const paths =
    Array.isArray(options.paths) && options.paths.length > 0
      ? options.paths.map((p) => (p.startsWith("/") ? p : `/${p}`))
      : DEFAULT_PATHS;
  const timeout =
    typeof options.timeout === "number" && options.timeout > 0
      ? options.timeout
      : DEFAULT_TIMEOUT_MS;
  const saveToCsv = options.saveToCsv !== false && Boolean(csvFile);

  console.log(`Scraping data from: ${normalizedBase}`);
  const browser = await getPuppeteer().launch();
  const results = [];

  try {
    const page = await browser.newPage();
    const pagesToScrape = paths.map((subPath) => `${normalizedBase}${subPath}`);

    for (const pageUrl of pagesToScrape) {
      try {
        console.log(`Navigating to: ${pageUrl}`);
        await page.goto(pageUrl, {
          waitUntil: "domcontentloaded",
          timeout,
        });

        // Get the entire page content
        const pageContent = await page.content();

        // Extract phone numbers
        const phoneNumbers = pageContent.match(/\d{10,}/g) || [];

        // Extract emails using page.evaluate
        const emails = await page.evaluate(() => {
          const extractEmails = (text) => {
            const emailRegex =
              /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            const matches = text.match(emailRegex);
            return matches
              ? matches.filter((match, index) => matches.indexOf(match) === index)
              : [];
          };
          const elements = Array.from(document.querySelectorAll("p, li, div"));
          const textContent = elements
            .map((element) => element.textContent)
            .join(" ");
          return extractEmails(textContent);
        });

        const data = {
          pageUrl,
          phoneNumbers,
          emails,
        };

        if (saveToCsv) {
          const csvWriter = createCsvWriter({
            path: csvFile,
            header: [
              { id: "pageUrl", title: "Page URL" },
              { id: "phoneNumbers", title: "Phone Numbers" },
              { id: "emails", title: "Emails" },
            ],
            append: true,
          });

          await csvWriter.writeRecords([data]);
        }

        results.push({
          pageUrl,
          status: "success",
          phoneNumbers,
          emails,
        });
        console.log(`Scraped data successfully for: ${pageUrl}`);
      } catch (error) {
        console.error(`Failed to scrape ${pageUrl}:`, error.message);
        results.push({
          pageUrl,
          status: "error",
          phoneNumbers: [],
          emails: [],
          error: error.message,
        });
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`Finished scraping for: ${normalizedBase}`);

  return {
    url: normalizedBase,
    scrapedAt: new Date().toISOString(),
    savedToCsv: saveToCsv,
    csvFile: saveToCsv ? csvFile : null,
    results,
  };
}

module.exports = {
  DEFAULT_PATHS,
  DEFAULT_TIMEOUT_MS,
  validateDomain,
  scrapeAndSaveData,
};
