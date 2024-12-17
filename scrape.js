const { scrapeAndSaveData } = require("./scraper");
const { urls } = require("./urls");
const dns = require("dns").promises;

// Function to validate if a domain is resolvable
async function isValidDomain(url) {
  try {
    const domain = new URL(url).hostname;
    await dns.lookup(domain);
    return true;
  } catch (error) {
    console.error(`Invalid domain: ${url}`);
    return false;
  }
}

// Main scrape function
const scrape = async (urls) => {
  console.log("Starting scrape for the following URLs:", urls.slice(0, 5));

  for (const url of urls) {
    const trimmedUrl = url.trim(); // Clean up the URL
    try {
      const isValid = await isValidDomain(trimmedUrl);
      if (!isValid) {
        console.log(`Skipping invalid URL: ${trimmedUrl}`);
        continue; // Skip invalid URLs
      }

      // Call the scrapeAndSaveData function
      await scrapeAndSaveData(trimmedUrl, "data.csv");
    } catch (error) {
      console.error(`Error scraping ${trimmedUrl}:`, error.message);
      // Continue to the next URL even if one fails
    }
  }

  console.log("Scraping completed.");
};

// Start the scraping process
scrape(urls);
