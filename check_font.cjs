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

async function run() {
  try {
    const html = await get('https://tajtrading.de');
    const cssLinks = [...html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map(m => m[1]);
    
    console.log(`Found ${cssLinks.length} CSS files. Fetching to analyze fonts...`);
    
    const fonts = new Set();
    for (let link of cssLinks) {
      if (link.startsWith('/')) link = 'https://tajtrading.de' + link;
      try {
        const css = await get(link);
        const matches = [...css.matchAll(/font-family:\s*([^;]+);/g)];
        for (const match of matches) {
          fonts.add(match[1].trim());
        }
      } catch(e) {
        // ignore
      }
    }
    
    console.log('\nExtracted Font Families:');
    Array.from(fonts).forEach(f => console.log(f));
    
  } catch(e) {
    console.error(e);
  }
}
run();
