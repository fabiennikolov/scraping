const puppeteer = require('puppeteer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

async function downloadImage(imageUrl, imageName) {
  const response = await axios.get(imageUrl, { responseType: 'stream' });
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const dir = `${__dirname}/output/${timestamp}`

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const imagePath = `${dir}/${imageName}`
    const fileStream = fs.createWriteStream(imagePath);
    response.data.pipe(fileStream);

    response.data.on('end', () => resolve(imagePath));
    response.data.on('error', (error) => {
      fileStream.close();
      reject(error);
    });
  });
}

async function scrapeTikTokPost(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url);

  const avatarImageSelector = 'a[data-e2e="browse-user-avatar"] img';

  const avatarImageElement = await page.$(avatarImageSelector);
  const avatarImageUrl = await page.evaluate(element => {
    return element ? element.src : null;
  }, avatarImageElement);

  if (avatarImageUrl) {
    const avatarImageName = 'avatar_image.jpg';
    const downloadedImagePath = await downloadImage(avatarImageUrl, avatarImageName);
    console.log('Avatar image downloaded:', downloadedImagePath);
  } else {
    console.log('Avatar image not found.');
  }

  const postContentSelector = 'h1[data-e2e="browse-video-desc"]';
  const likesCountSelector = 'strong[data-e2e="like-count"]';
  const commentCountSelector = 'strong[data-e2e="comment-count"]';
  const postSavesCountSelector = 'strong[data-e2e="undefined-count"]';
  const shareCountSelector = 'strong[data-e2e="share-count"]';

  await page.waitForSelector(postContentSelector);
  await page.waitForSelector(likesCountSelector);
  await page.waitForSelector(commentCountSelector);
  await page.waitForSelector(postSavesCountSelector);
  await page.waitForSelector(shareCountSelector);

  const postContentElement = await page.$(postContentSelector);
  const likesCountElement = await page.$(likesCountSelector);
  const commentCountElement = await page.$(commentCountSelector);
  const postSavesCountElement = await page.$(postSavesCountSelector);
  const shareCountElement = await page.$(shareCountSelector);

  const postContent = await page.evaluate(element => {
    return element ? element.innerText : 'TikTok post content not found.';
  }, postContentElement);

  const likesCount = await page.evaluate(element => {
    return element ? element.innerText : 'Likes count not found.';
  }, likesCountElement);

  const commentCount = await page.evaluate(element => {
    return element ? element.innerText : 'Comment count not found.';
  }, commentCountElement);

  const postSavesCount = await page.evaluate(element => {
    return element ? element.innerText : 'Post saves count not found.';
  }, postSavesCountElement);

  const shareCount = await page.evaluate(element => {
    return element ? element.innerText : 'Share count not found.';
  }, shareCountElement);

  await browser.close();

  return {
    postContent,
    likesCount,
    commentCount,
    postSavesCount,
    shareCount,
  };
}

const url = process.argv[2];

if (!url) {
  console.log('Please provide a URL.');
  process.exit(1);
}

if (url.includes('tiktok.com')) {
  scrapeTikTokPost(url)
    .then(data => {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `tiktok_data_${timestamp}.json`;
      const filePath = path.join(__dirname, filename);

      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonData);

      console.log(`Data saved to ${filename}`);
    })
    .catch(error => console.error('Error scraping data:', error));
} else {
  console.log('Unsupported platform. Please provide a valid TikTok URL.');
}
