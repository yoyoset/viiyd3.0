const fs = require('fs');
const path = require('path');

const WORK_DIR = path.join(__dirname, '../content/work');

// UI Replacements (English -> Chinese)
const REPLACEMENTS = [
    { from: /The Alchemy/g, to: "炼金配方" },
    { from: /Tactical Protocol/g, to: "战术规程" },
    { from: /Quality Tier/g, to: "质量等级" },
    { from: /Standard/g, to: "标准" }, // Context dependent, careful? "Tier: Standard" -> "质量等级: 标准"
    { from: /Time Log/g, to: "执行工时" },
    { from: /Execution Time/g, to: "执行工时" },
    { from: /Unit Count/g, to: "单位数量" },
    { from: /Unit/g, to: "单位" },
    { from: /INITIATE COMMISSION ->/g, to: "启动委托程序 ->" },
    { from: /Ready to Deploy\?/g, to: "准备好部署了吗？" },
    { from: /Use Case:/g, to: "作战定位:" },
    { from: /Color Data/g, to: "色彩数据" },
    { from: /Methodology/g, to: "执行方案" },
    { from: /description: "自动迁移内容"/g, to: "" }, // Remove this line
    { from: /description: "Automated migrated content"/g, to: "" }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Extract Archive Data Summary
    // Pattern: Look for second YAML block or "/// ARCHIVE_DATA" -> yaml
    // The legacy content is usually inside a prose block at the bottom
    // We look for `summary: "(.*)"` appearing later in the file.

    // Split file by "---" to find the Archive block. 
    // Usually: Frontmatter --- Body --- Archive --- 
    // But my migration script put archive in a Markdown code block or just text? 
    // In sample: `/// ARCHIVE_DATA ... --- ... summary: "..."`

    const archiveMatch = content.match(/ARCHIVE_DATA[\s\S]*?summary:\s*"(.*?)"/);
    let newSummary = "";

    if (archiveMatch && archiveMatch[1]) {
        newSummary = archiveMatch[1];
        console.log(`[FOUND SUMMARY] ${path.basename(filePath)}: ${newSummary.substring(0, 20)}...`);
    }

    // 2. Update Frontmatter Summary
    if (newSummary) {
        // Replace top summary
        content = content.replace(/^summary: ".*?"/m, `summary: "${newSummary}"`);
        // Update description if it exists, or add it
        // Actually, just ensuring summary is good is enough.
        // Let's remove any `description: "自动..."` lines first (handled by REPLACEMENTS)
    }

    // 3. UI Replacements (Body Text)
    REPLACEMENTS.forEach(rep => {
        content = content.replace(rep.from, rep.to);
    });

    // 4. Manual Fix: Tier "Standard" to "标准" in specific context if needed
    // But "Standard" might be a value. 

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[UPDATED] ${path.basename(filePath)}`);
    } else {
        console.log(`[SKIPPED] ${path.basename(filePath)} (No changes)`);
    }
}

function main() {
    const dirs = fs.readdirSync(WORK_DIR, { withFileTypes: true });

    dirs.forEach(dirent => {
        if (dirent.isDirectory()) {
            const zhPath = path.join(WORK_DIR, dirent.name, 'index.zh.md');
            if (fs.existsSync(zhPath)) {
                processFile(zhPath);
            }
        }
    });
}

main();
