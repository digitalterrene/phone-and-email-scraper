# Phone and Email Scraper

A web scraping tool built with Node.js and Puppeteer that extracts phone numbers and email addresses from contact pages of websites. It writes the extracted data to a CSV file for further analysis or use.

---

## **Features**

- Scrapes phone numbers and email addresses from specified websites.
- Handles common errors, such as invalid URLs or network issues, and continues scraping other websites.
- Saves extracted data into a structured CSV file.
- Lightweight and easy to configure for different use cases.

---

## **Requirements**

- Node.js v16 or later
- Puppeteer
- CSV Writer

---

## **Installation**

1. Clone the repository:

   ```bash
   git clone https://github.com/digitalterrene/phone-and-email-scraper.git
   cd phone-and-email-scraper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## **Usage**

1. **Prepare URLs**  
   Add the list of URLs to scrape in the `urls.js` file:

   ```javascript
   const urls = [
     "http://www.example1.com",
     "http://www.example2.com",
     // Add more URLs here
   ];
   module.exports = { urls };
   ```

2. **Run the Scraper**  
   Start the script with:

   ```bash
   node scrape.js
   ```

3. **Output**
   - Extracted data will be saved in `data.csv` in the same directory.
   - Each row includes the page URL, phone numbers, and email addresses.

---

## **File Structure**

```
phone-and-email-scraper/
├── scrape.js      # Entry point of the application
├── scraper.js     # Handles the core scraping logic
├── urls.js        # Contains the list of URLs to scrape
├── data.csv       # Output file containing scraped data
├── package.json   # Project configuration and dependencies
└── README.md      # Documentation
```

---

## **Error Handling**

- **Invalid Domains**: If a domain cannot be resolved, it will log an error and skip to the next URL.
- **Navigation Errors**: If the scraper cannot access a specific page (e.g., `net::ERR_NAME_NOT_RESOLVED`), it logs the issue and continues with other pages.
- **Timeouts**: Pages that take too long to load are skipped to avoid delays.

---

## **Customizing the Scraper**

### Add New Pages to Scrape

Modify the `pagesToScrape` array in `scraper.js` to include additional page paths:

```javascript
const pagesToScrape = [`${url}/contact`, `${url}/contact-us`, `${url}/about`];
```

### Change the Output File

Specify a different file name in `scrape.js`:

```javascript
scrapeAndSaveData(trimmedUrl, "my_custom_data.csv");
```

---

## **Example Output**

### **CSV File Content:**

| Page URL                           | Phone Numbers | Emails               |
| ---------------------------------- | ------------- | -------------------- |
| http://www.example1.com/contact    | 1234567890    | info@example1.com    |
| http://www.example2.com/contact-us | 9876543210    | support@example2.com |

---

## **Contributing**

Contributions are welcome! If you encounter a bug or have a feature request, please open an issue or submit a pull request on GitHub.

---

## **License**

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

### **GitHub Repository**

Access the project on GitHub:  
🔗 [https://github.com/digitalterrene/phone-and-email-scraper.git](https://github.com/digitalterrene/phone-and-email-scraper.git)

For any questions or support, feel free to open an issue! 🚀
