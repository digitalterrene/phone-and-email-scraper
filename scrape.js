const { scrapeAndSaveData, validateDomain } = require("./scraper");
const { urls } = require("./urls");

// Function to validate if a domain is resolvable
async function isValidDomain(url) {
  const validation = await validateDomain(url);
  if (!validation.valid) {
    console.error(`Invalid domain: ${url}`);
    return false;
  }
  return true;
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
