/**
 * Batch optimize large static images
 * Usage: node scripts/optimize_static.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TARGETS = [
    // static/img large files
    'static/img/Gemini_Generated_Image_jv1qb9jv1qb9jv1q.png',
    'static/img/card-boom.png',
    // static/img/studio
    'static/img/studio/_WER0410.jpg',
    'static/img/studio/_WER0411.jpg',
    'static/img/studio/_WER0412.jpg',
    'static/img/studio/_WER0413.jpg',
    'static/img/studio/_WER0414.jpg',
    'static/img/studio/_WER0419.jpg',
    'static/img/studio/_WER0423.jpg',
    'static/img/studio/_WER0425.jpg',
    'static/img/studio/_WER0426.jpg',
    // static/stock
    'static/stock/gallery-1.jpg',
    'static/stock/gallery-2.jpg',
    'static/stock/gallery-3.jpg',
    'static/stock/gallery-4.jpg',
    'static/stock/studio-env.jpg',
];

async function optimizeImages() {
    console.log('🚀 Starting static image optimization...\n');

    let successCount = 0;
    let totalSaved = 0;

    for (const relPath of TARGETS) {
        const fullPath = path.resolve(relPath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  Skipped (not found): ${relPath}`);
            continue;
        }

        const origSize = fs.statSync(fullPath).size;
        const ext = path.extname(fullPath).toLowerCase();
        const tempPath = fullPath + '.tmp';

        try {
            let pipeline = sharp(fullPath)
                .resize({ width: 1600, withoutEnlargement: true });

            if (ext === '.png') {
                pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
            } else {
                pipeline = pipeline.jpeg({ quality: 80 });
            }

            await pipeline.toFile(tempPath);

            const newSize = fs.statSync(tempPath).size;
            const saved = origSize - newSize;

            // Replace original with optimized
            fs.unlinkSync(fullPath);
            fs.renameSync(tempPath, fullPath);

            totalSaved += saved;
            successCount++;

            console.log(`✅ ${path.basename(fullPath)}: ${(origSize / 1024 / 1024).toFixed(1)}MB → ${(newSize / 1024 / 1024).toFixed(1)}MB (saved ${(saved / 1024 / 1024).toFixed(1)}MB)`);
        } catch (err) {
            console.error(`❌ Failed: ${relPath} - ${err.message}`);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }

    console.log(`\n🎉 Optimization complete: ${successCount}/${TARGETS.length} files`);
    console.log(`💾 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(1)}MB`);
}

optimizeImages();
