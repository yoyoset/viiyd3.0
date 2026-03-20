/**
 * VIIYD Fast R2 Upload Script (Parallelized)
 * 
 * Usage: node scripts/fast_upload_r2.js [source_folder] [bucket_name] [r2_path_prefix]
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function uploadImages(sourceFolder, bucketName, r2Prefix) {
    if (!sourceFolder || !bucketName || !r2Prefix) {
        console.error('❌ Usage: node fast_upload_r2.js [source_folder] [bucket_name] [r2_path_prefix]');
        process.exit(1);
    }

    const absolutePath = path.resolve(sourceFolder);
    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Source folder not found: ${absolutePath}`);
        process.exit(1);
    }

    const cleanPrefix = r2Prefix.replace(/^\/+|\/+$/g, '');
    const files = fs.readdirSync(absolutePath)
        .filter(f => ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase()));

    if (files.length === 0) {
        console.error('❌ No images found in source folder');
        process.exit(1);
    }

    console.log(`🚀 Starting PARALLEL upload of ${files.length} files to R2`);
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Path:   ${cleanPrefix}/`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const CONCURRENCY = 3;
    let completed = 0;
    let successCount = 0;

    const runUpload = async (file) => {
        const localPath = path.join(absolutePath, file);
        const r2Key = `${cleanPrefix}/${file}`;
        const objectPath = `${bucketName}/${r2Key}`;

        try {
            // Using direct 'wrangler' if available, otherwise 'npx wrangler'
            const cmd = `wrangler r2 object put ${bucketName}/${r2Key} --file "${localPath}" --remote`;
            await execPromise(cmd);
            successCount++;
            completed++;
            console.log(`[${completed}/${files.length}] ✅ ${file}`);
        } catch (error) {
            completed++;
            console.error(`[${completed}/${files.length}] ❌ FAILED ${file}: ${error.message}`);
        }
    };

    // Simple queue / pool
    const queue = [...files];
    const workers = Array(CONCURRENCY).fill(null).map(async () => {
        while (queue.length > 0) {
            const file = queue.shift();
            await runUpload(file);
        }
    });

    await Promise.all(workers);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎉 Fast Upload Complete: ${successCount}/${files.length} successful`);
}

const args = process.argv.slice(2);
uploadImages(args[0], args[1], args[2]);
