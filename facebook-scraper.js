const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeFacebookPost(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url);

  // Wait for the post content to load (you may need to adjust the selector)
  await page.waitForSelector('div[data-ad-comet-preview="message"]');

  const postContentElement = await page.$('div[data-ad-comet-preview="message"]');
  const postContent = await page.evaluate(element => {
    return element ? element.innerText : 'Post content not found.';
  }, postContentElement);

  await browser.close();

  // Remove special characters and newlines
  const cleanedPostContent = postContent.replace(/[^\w\s.]/gi, '').replace(/\n/g, ' ');

  return { url, postContent: cleanedPostContent };
}

const url = process.argv[2]; // Get the URL from the command line arguments

if (!url) {
  console.log('Please provide a URL.');
  process.exit(1);
}

if (url.includes('facebook.com')) {
  scrapeFacebookPost(url)
    .then(data => {
      const timestamp = new Date().toISOString().replace(/:/g, '-'); // Generate a unique timestamp
      const filename = `facebook_data_${timestamp}.json`;
      const filePath = path.join(__dirname, filename);

      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonData);

      console.log(`Data saved to ${filename}`);
    })
    .catch(error => console.error('Error scraping data:', error));
} else {
  console.log('Unsupported platform. Please provide a valid Facebook URL.');
}
