
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'apps/mobile/locales');
const enUsPath = path.join(localesDir, 'en-US.json');

if (!fs.existsSync(enUsPath)) {
    console.error('en-US.json not found!');
    process.exit(1);
}

const enUs = JSON.parse(fs.readFileSync(enUsPath, 'utf8'));

function flattenKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(flattenKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

const baseKeys = new Set(flattenKeys(enUs));

fs.readdirSync(localesDir).forEach(file => {
    if (file === 'en-US.json' || !file.endsWith('.json')) return;

    const filePath = path.join(localesDir, file);
    const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const localeKeys = new Set(flattenKeys(locale));

    const missingKeys = [...baseKeys].filter(key => !localeKeys.has(key));

    if (missingKeys.length > 0) {
        console.log(`Missing keys in ${file}:`);
        missingKeys.forEach(key => console.log(`  - ${key}`));
    } else {
        // console.log(`${file} is up to date.`);
    }
});
