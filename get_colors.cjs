const fs = require('fs');
const css = fs.readFileSync('taj_styles.css', 'utf8');
const hexes = css.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
const counts = {};
hexes.forEach(h => {
  const c = h.toLowerCase();
  counts[c] = (counts[c] || 0) + 1;
});
const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 20);
console.log('Most common colors:', sorted);
