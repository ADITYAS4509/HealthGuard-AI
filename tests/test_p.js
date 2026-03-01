const fs = require('fs');
const content = fs.readFileSync('site/public/assets/js/cities.js', 'utf8');
eval(content);

const val = 'p';
const tier1 = [];
const tier2 = [];
const tier3 = [];

for (const city of INDIAN_CITIES) {
    const lowerCity = city.toLowerCase();
    if (lowerCity.startsWith(val)) {
        tier1.push(city);
    } else if (lowerCity.includes(' ' + val)) {
        tier2.push(city);
    } else if (lowerCity.includes(val)) {
        tier3.push(city);
    }
}

const matches = [...tier1, ...tier2, ...tier3].slice(0, 8);
console.log(matches);
