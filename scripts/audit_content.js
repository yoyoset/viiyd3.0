const fs = require('fs');
const path = require('path');

const workDir = path.join(__dirname, '../content/work');
const tiers = new Set();
const issues = [];
const titles = [];

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath);
        } else {
            if (file.endsWith('.zh.md')) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Check Tier
                const tierMatch = content.match(/^tier:\s*["']?([^"'\n]+)["']?/m);
                if (tierMatch) {
                    tiers.add(tierMatch[1].trim());
                }

                // Check Title
                const titleMatch = content.match(/^title:\s*["']?([^"'\n]+)["']?/m);
                if (titleMatch) {
                    const title = titleMatch[1];
                    // Simple heuristic: if title has no Chinese characters, flag it
                    if (!/[\u4e00-\u9fa5]/.test(title)) {
                        titles.push({ file: path.basename(path.dirname(filePath)), title: title });
                    }
                }

                // Check Bad Keywords
                if (content.includes('待确认') || content.includes('To be confirmed') || content.includes('Automated migrated content')) {
                    issues.push({ file: path.basename(path.dirname(filePath)), type: 'Placeholder' });
                }
            }
        }
    });
}

const report = {
    tiers: Array.from(tiers),
    titles: titles,
    issues: issues
};
fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
console.log('Report written to audit_report.json');
