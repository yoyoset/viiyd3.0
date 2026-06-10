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
        } else if (file.endsWith('.md')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const slug = path.basename(path.dirname(filePath));

            // Tier must be one of the WORK_TEMPLATE enum values (both languages)
            const TIER_ENUM = ['Battleline', 'Specialist', 'Spec Ops', 'Master', 'Legend'];
            const tierMatch = content.match(/^tier:\s*["']?([^"'\n]+)["']?/m);
            if (tierMatch) {
                const tier = tierMatch[1].trim();
                tiers.add(tier);
                if (!TIER_ENUM.includes(tier)) {
                    issues.push({ file: slug + '/' + file, type: 'InvalidTier', detail: `tier "${tier}" is not in the enum: ${TIER_ENUM.join(' | ')}` });
                }
            }

            if (file.endsWith('.zh.md')) {

                // Check Title
                const titleMatch = content.match(/^title:\s*["']?([^"'\n]+)["']?/m);
                if (titleMatch) {
                    const title = titleMatch[1];
                    // Simple heuristic: if title has no Chinese characters, flag it
                    if (!/[一-龥]/.test(title)) {
                        titles.push({ file: slug, title: title });
                    }
                }

                // Check Bad Keywords
                if (content.includes('待确认') || content.includes('To be confirmed') || content.includes('Automated migrated content')) {
                    issues.push({ file: slug, type: 'Placeholder' });
                }
            }

            // Check lightbox wiring (both languages): showcase pages whose cover
            // follows the R2 `[PREFIX]_NN.webp` pattern render their gallery from
            // the `photos: N` plates grid in layouts/work/single.html. Missing
            // `photos:` drops the page to the raw .Content branch = broken layout
            // (the June-2026 regression). Pages with non-R2 covers (e.g. local
            // guide articles) legitimately rely on shortcodes and are exempt.
            const coverMatch = content.match(/^cover:\s*["']?(https:\/\/photo\.viiyd\.com\/\S*_\d+\.(webp|jpe?g|png))["']?/m);
            const usesLightbox = content.includes('{{< lightbox');
            const hasPhotos = /^photos:\s*\d+/m.test(content);
            if (coverMatch && usesLightbox && !hasPhotos) {
                issues.push({ file: slug + '/' + file, type: 'MissingPhotos', detail: 'uses {{< lightbox >}} but has no `photos: N` — lightbox will not work' });
            }
        }
    });
}

walk(workDir);

const report = {
    tiers: Array.from(tiers),
    titles: titles,
    issues: issues
};
fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
console.log('Report written to audit_report.json');

if (issues.length) {
    console.log(`\n⚠  ${issues.length} issue(s) found:`);
    issues.forEach(i => console.log(`   [${i.type}] ${i.file}${i.detail ? ' — ' + i.detail : ''}`));
    if (issues.some(i => i.type === 'MissingPhotos' || i.type === 'InvalidTier')) {
        console.log('\n   MissingPhotos fix: add `photos: N` to the frontmatter (N = number of _01.._NN images).');
        console.log('   InvalidTier fix: use one of Battleline | Specialist | Spec Ops | Master | Legend, or remove the line.');
        process.exitCode = 1;
    }
} else {
    console.log('No issues found.');
}
