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

const rootDir = path.resolve(__dirname, '..'); // Assuming scripts/ is one level deep
const files = walk(rootDir);
let errorFound = false;

const regex = /\{\{\s*relLangURL\s+" /g;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (regex.test(content)) {
        console.error(`❌ Error in ${file}: Found 'relLangURL " ' (leading space)`);

        // Show context
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (regex.test(line)) {
                console.log(`   Line ${index + 1}: ${line.trim()}`);
            }
        });
        errorFound = true;
    }
});

if (errorFound) {
    console.log("Found syntax errors.");
    process.exit(1);
} else {
    console.log("✅ No 'relLangURL \" ' patterns found.");
}
