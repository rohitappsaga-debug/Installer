const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
let out = '';
for (const key in envConfig) {
    out += `${key}=${envConfig[key]}\n`;
}
fs.writeFileSync('.env', out);
console.log('Normalized .env');
