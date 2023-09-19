const puppeteer = require('puppeteer');

async function scrapeFacebookPost(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  // Puppeteer code to scrape Facebook post using the provided URL
  // ...
  await browser.close();
}

const url = process.argv[2]; // Get the URL from the command line arguments

if (!url) {
  console.log('Please provide a URL.');
  process.exit(1);
}

if (url.includes('facebook.com')) {
  scrapeFacebookPost(url);
} else {
  console.log('Unsupported platform. Please provide a valid Facebook URL.');
}
