/**
 * VIIYD R2 Upload Script (Wrapper for Wrangler)
 * 
 * Usage: node scripts/upload_r2.js [source_folder] [bucket_name] [r2_path_prefix]
 * Example: node scripts/upload_r2.js ./need_upload viiyd-art-photos 2026/01/bullg
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function uploadImages(sourceFolder, bucketName, r2Prefix) {
    if (!sourceFolder || !bucketName || !r2Prefix) {
        console.error('❌ Usage: node upload_r2.js [source_folder] [bucket_name] [r2_path_prefix]');
        process.exit(1);
    }

    const absolutePath = path.resolve(sourceFolder);
    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Source folder not found: ${absolutePath}`);
        process.exit(1);
    }

    // Normalize prefix (remove leading/trailing slashes)
    const cleanPrefix = r2Prefix.replace(/^\/+|\/+$/g, '');

    const files = fs.readdirSync(absolutePath)
        .filter(f => ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase()));

    if (files.length === 0) {
        console.error('❌ No images found in source folder');
        process.exit(1);
    }

    console.log(`🚀 Starting upload of ${files.length} files to R2`);
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Path:   ${cleanPrefix}/`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let successCount = 0;

    files.forEach((file, index) => {
        const localPath = path.join(absolutePath, file);
        const r2Key = `${cleanPrefix}/${file}`;
        const objectPath = `${bucketName}/${r2Key}`;

        process.stdout.write(`[${index + 1}/${files.length}] Uploading ${file}... `);

        try {
            // Using npx wrangler to ensure local version is used, enforcing remote upload
            execSync(`npx wrangler r2 object put "${objectPath}" --file "${localPath}" --remote`, { stdio: 'pipe' });
            process.stdout.write('✅\n');
            successCount++;
        } catch (error) {
            process.stdout.write('❌ FAILED\n');
            console.error(`   Error: ${error.message}`);
        }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎉 Upload Complete: ${successCount}/${files.length} successful`);

    if (successCount > 0) {
        console.log(`\n🔗 Sample URL (Verify manually):`);
        console.log(`   https://photo.viiyd.com/${cleanPrefix}/${files[0]}`);
    }
}

const args = process.argv.slice(2);
uploadImages(args[0], args[1], args[2]);
