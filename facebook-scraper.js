const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeFacebookPost(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url);

  // Wait for the post content to load (you may need to adjust the selector)
  await page.waitForSelector('div[data-ad-comet-preview="message"]');

  const postContent = await page.evaluate(() => {
    const postElement = document.querySelector('div[data-ad-comet-preview="message"]');
    return postElement ? postElement.innerText : 'Post content not found.';
  });

  const scrapedData = {
    url,
    postContent
  };

  await browser.close();

  return scrapedData;
}

const url = process.argv[2]; // Get the URL from the command line arguments

if (!url) {
  console.log('Please provide a URL.');
  process.exit(1);
}

if (url.includes('facebook.com')) {
  scrapeFacebookPost(url)
    .then(data => {
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync('scraped_data.json', jsonData);
      console.log('Data saved to scraped_data.json');
    })
    .catch(error => console.error('Error scraping data:', error));
} else {
  console.log('Unsupported platform. Please provide a valid Facebook URL.');
}
