const puppeteer = require("puppeteer");
const fs = require("fs");
const crypto = require("crypto");
const papa = require("papaparse");
const moment = require("moment");
const nodemailer = require("nodemailer");

const urls = [
  "https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.quotes.html#venue=globex",
  "https://www.cmegroup.com/markets/energy/natural-gas/natural-gas.quotes.html#venue=globex",
  "https://www.cmegroup.com/markets/energy/petrochemicals/mont-belvieu-propane-5-decimals-swap.html#venue=globex",
  "https://www.cmegroup.com/markets/energy/petrochemicals/mont-belvieu-normal-butane-5-decimals-swap.html#venue=globex",
  "https://www.cmegroup.com/markets/energy/petrochemicals/mont-belvieu-iso-butane-5-decimal-opis-swap-futures.html#venue=globex",
  "https://www.cmegroup.com/markets/energy/petrochemicals/mont-belvieu-natural-gasoline-5-decimal-opis-swap.html#venue=globex",
];
// List of User-Agent strings
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const runScraping = async () => {
  console.log("Starting cmegroup Bot scraper...");
  console.log("*******************************");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  // Set a random User-Agent for this request
  await page.setUserAgent(getRandomUserAgent());

  // Disable unnecessary requests
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (["image", "stylesheet", "font"].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  const resultData = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`cmegroup Bot ${i + 1}/${urls.length} : scraping ${url}`);
    await page.goto(url);
    // wait 2 seconds for the page to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(` ${i + 1}/${urls.length} Bot is scraping ...`);

    await page.waitForSelector("div.table-container");
    const button = await page.$(
      'button.btn.btn-.load-all.primary[type="button"] span.text'
    );
    if (button) {
      await button.click();
    }

    const rows = await page.$$("table tbody tr");

    for (const row of rows) {
      const data = await row.$$eval("td", (cells) =>
        cells.map((cell) => cell.textContent.trim())
      );

      if (data.length >= 8) {
        const [
          month,
          options,
          chart,
          last,
          change,
          priorSettle,
          open,
          high,
          low,
          volume,
          updated,
        ] = data;

        // Extract the "UNIQUE CODE" from the "month" field
        const uniqueCodeMatch = month.match(/([A-Z0-9]{4})$/); // match the last four characters of the string
        const uniqueCode = uniqueCodeMatch ? uniqueCodeMatch[1] : "";

        // Extract the "MONTH" field in the format "MON YYYY"
        const monthMatch = month.match(/(\w{3}) (\d{4})/);
        const monthFormatted = monthMatch
          ? monthMatch[1] + " " + monthMatch[2]
          : "";
        const rowData = {
          "UNIQUE CODE": uniqueCode,
          MONTH: monthFormatted,
          OPTIONS: options === "OPT" ? "" : options, // Check if "OPTIONS" is 'OPT', and replace with an empty string if true
          LAST: last === "" ? "-" : last, // Replace empty "LAST" with '-'
          CHANGE: change === "" ? "-" : change, // Replace empty "CHANGE" with '-'
          "PRIOR SETTLE": priorSettle === "-" ? "" : priorSettle, // Replace '-' with an empty string
          OPEN: open === "" ? "-" : open, // Replace '-' with an empty string
          HIGH: high === "" ? "-" : high, // Replace '-' with an empty string
          LOW: low === "" ? "-" : low, // Replace '-' with an empty string
          VOLUME: volume === "" ? "-" : volume, // Replace '-' with an empty string
          UPDATED: updated === "" ? "-" : updated, // Replace '-' with an empty string
        };
        resultData.push(rowData);
      }
    }
  }

  // Convert data to CSV format
  const csv = papa.unparse(resultData);

  // Get the current date and time, Hrs Mm
  // const now = moment().format("YYYY-MM-DD_HH-mm");
  const timestamp = moment().format("YYYYMMDD_HHmmss");
  const csvFilename = `scraped_data_${timestamp}.csv`;

  // Write CSV data to a file
  fs.writeFileSync(csvFilename, csv);
  // Prepare the email with the CSV data as an attachment
  // sendEmailWithCSV(csv, `Scrapedresult_${now}.csv`);
  sendEmailWithCSV(csvFilename);
  await browser.close();
};

async function sendEmailWithCSV(csvFilePath) {
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "captindoodle@gmail.com",
      pass: "zqqn pnie iuot lups",
    },
  });

  let info = await transporter.sendMail({
    from: `"cmeGroupBot" <${"captindoodle@gmail.com"}>`,
    to: "captindoodle@gmail.com",
    subject: "Scraped Data",
    text: "Here is the scraped data.",
    attachments: [
      {
        path: csvFilePath,
      },
    ],
  });

  console.log("Message sent: %s", info.messageId);
}

// Run the script immediately (for testing or the first time)
runScraping();
