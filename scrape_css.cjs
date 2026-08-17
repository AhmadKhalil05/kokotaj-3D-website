const fs = require('fs');
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeStyles() {
  console.log('Fetching main page...');
  const html = await get('https://tajtrading.de');
  
  // Find all stylesheet links
  const regex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
  const links = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith('/')) {
      url = 'https://tajtrading.de' + url;
    }
    links.push(url);
  }
  
  console.log('Found CSS links:', links);
  
  let combinedCss = '';
  for (const url of links) {
    try {
      console.log('Fetching CSS:', url);
      const css = await get(url);
      combinedCss += `\n/* SOURCE: ${url} */\n` + css;
    } catch(e) {
      console.error('Error fetching', url, e.message);
    }
  }
  
  fs.writeFileSync('taj_styles.css', combinedCss);
  console.log('Saved to taj_styles.css');
}

scrapeStyles();
