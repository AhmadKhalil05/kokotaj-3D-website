const https = require('https');
const fs = require('fs');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const html = await get('https://tajtrading.de');
  
  // Find favicon
  const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
  let faviconUrl = '';
  if (iconMatch) {
    faviconUrl = iconMatch[1];
    if (faviconUrl.startsWith('/')) faviconUrl = 'https://tajtrading.de' + faviconUrl;
    console.log('Found favicon:', faviconUrl);
    await download(faviconUrl, path.join(__dirname, 'public', 'favicon.ico'));
    console.log('Saved favicon.ico');
  }

  // Find logo (look for img tags with "logo" in src or class)
  const imgMatches = [...html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  let logoUrl = '';
  for (const match of imgMatches) {
    const src = match[1];
    if (src.toLowerCase().includes('logo') && !src.toLowerCase().includes('svg')) {
      logoUrl = src;
      break;
    }
  }
  
  if (!logoUrl) {
    // If no logo found with 'logo' in name, just print all images to let us pick
    console.log('No logo found directly, here are all images:');
    console.log(imgMatches.map(m => m[1]).slice(0, 10));
  } else {
    if (logoUrl.startsWith('/')) logoUrl = 'https://tajtrading.de' + logoUrl;
    console.log('Found logo:', logoUrl);
    // Usually it's a PNG or JPG. We'll save it as logo.png
    const ext = logoUrl.split('.').pop().split('?')[0];
    await download(logoUrl, path.join(__dirname, 'public', `logo.${ext}`));
    console.log(`Saved logo.${ext}`);
  }
}

run();
