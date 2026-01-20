// Fix leading spaces in relLangURL calls
const fs = require('fs');
const path = require('path');

const files = [
    'layouts/index.html',
    'layouts/_default/single.html'
];

const pattern = /relLangURL\s+"\s+/g;
const replacement = 'relLangURL "';

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(pattern);
        if (matches) {
            console.log(`Found ${matches.length} issues in ${file}`);
            content = content.replace(pattern, replacement);
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Fixed ${file}`);
        } else {
            console.log(`No issues in ${file}`);
        }
    }
});

console.log('Done!');
