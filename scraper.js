const puppeteer = require("puppeteer");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

// Function to scrape data and save it to a CSV file
async function scrapeAndSaveData(url, csvFile) {
  console.log(`Scraping data from: ${url}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // List of pages to scrape
  const pagesToScrape = [`${url}/contact`, `${url}/contact-us`];

  for (const pageUrl of pagesToScrape) {
    try {
      console.log(`Navigating to: ${pageUrl}`);
      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
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

      // Prepare the data object
      const data = {
        pageUrl,
        phoneNumbers,
        emails,
      };

      // Append the scraped data to the CSV file
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
      console.log(`Scraped data successfully for: ${pageUrl}`);
    } catch (error) {
      console.error(`Failed to scrape ${pageUrl}:`, error.message);
      // Continue to the next page even if this one fails
    }
  }

  await browser.close();
  console.log(`Finished scraping for: ${url}`);
}

module.exports = { scrapeAndSaveData };
