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


  const selectors = {
    username: 'span[data-e2e="browse-username"]',
    postContent: 'h1[data-e2e="browse-video-desc"]',
    likesCount: 'strong[data-e2e="like-count"]',
    commentCount: 'strong[data-e2e="comment-count"]',
    postSavesCount: 'strong[data-e2e="undefined-count"]',
    shareCount: 'strong[data-e2e="share-count"]',

  }

  const data = {}

  for(const key of Object.keys(selectors)) {
    await page.waitForSelector(selectors[key]);

    const element = await page.$(selectors[key])

    data[key] = await page.evaluate(
      element =>  element ? element.innerText : 'Not found', 
      element
    )
  }

  await browser.close();

  return data
}

function metricToNumber(metric) {
  const prefixes = {'K': 1000, 'M': 1000000, 'B': 1000000000}

  const regex = new RegExp(`^[0-9]*\.?[0-9]+(${Object.keys(prefixes).join('|')})$`)

  if(regex.test(metric)){
    const number = Number(metric.slice(0, -1))
    const base = prefixes[metric.at(-1)]
    return number * base
  }
  else {
    return Number(metric)
  }
}

const url = process.argv[2];

if (!url) {
  console.log('Please provide a URL.');
  process.exit(1);
}

if (url.includes('tiktok.com')) {
  scrapeTikTokPost(url)
    .then(async (data) => {
      const serverUrl = 'https://postinfotwoserver.herokuapp.com/post'


      const response = await axios.post(
        serverUrl, 
        [{
          type: 1,
          URL: url,
          likes: metricToNumber(data.likesCount),
          comments: metricToNumber(data.commentCount),
          shares: metricToNumber(data.shareCount),
          page:data.username,
          text: data.postContent,
          date: '2020-01-01',
          show_after: '2020-01-01',
          source: 'Tiktok'
        }], 
        {
          headers: {
            'Content-Type': 'application/json; charset=UTF-8'
          }
        }
      )
      console.log(response)
    })
    .catch(error => console.error('Error scraping data:', error));
} else {
  console.log('Unsupported platform. Please provide a valid TikTok URL.');
}
