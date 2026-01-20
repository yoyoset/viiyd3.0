const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.agent') {
                walk(path.join(dir, file), fileList);
            }
        } else {
            if (file.endsWith('.html') || file.endsWith('.md')) {
                fileList.push(path.join(dir, file));
            }
        }
    }
    return fileList;
}

const rootDir = path.resolve(__dirname, '..');
const files = walk(rootDir);
let fixedCount = 0;

const regex = /\{\{\s*relLangURL\s+" /g;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (regex.test(content)) {
        const originalContent = content;
        // Replace '{{ relLangURL " ' with '{{ relLangURL "'
        // keeping the indentation and other parts intact
        content = content.replace(regex, '{{ relLangURL "');

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`✅ Fixed: ${file}`);
            fixedCount++;
        }
    }
});

console.log(`Total files fixed: ${fixedCount}`);
