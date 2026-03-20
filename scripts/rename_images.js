/**
 * VIIYD Image Rename Script
 * 
 * 用途: 将相机原始文件名批量重命名为 VIIYD 标准格式，并转换为 WebP
 * 格式: viiyd[YYYYMMDD][CODE]_[NN].webp
 * 
 * 用法:
 *   node scripts/rename_images.js [source_folder] [project_code] [optional_date]
 * 
 * 示例:
 *   node scripts/rename_images.js ./need_upload lion 20260318
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 支持的图片扩展名
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.JPG', '.JPEG', '.PNG'];

function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

async function renameImages(sourceFolder, projectCode, dateOverride) {
    // 验证参数
    if (!sourceFolder || !projectCode) {
        console.error('❌ 用法: node rename_images.js [source_folder] [project_code] [optional_date]');
        console.error('   示例: node rename_images.js ./need_upload lion 20260318');
        process.exit(1);
    }

    // 验证目录存在
    const absolutePath = path.resolve(sourceFolder);
    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ 目录不存在: ${absolutePath}`);
        process.exit(1);
    }

    // 获取所有图片文件
    const files = fs.readdirSync(absolutePath)
        .filter(file => IMAGE_EXTENSIONS.includes(path.extname(file)))
        .sort(); // 按原始文件名排序，保持顺序

    if (files.length === 0) {
        console.error('❌ 未找到图片文件');
        process.exit(1);
    }

    console.log(`📂 源目录: ${absolutePath}`);
    console.log(`📷 找到 ${files.length} 张图片\n`);

    // 生成前缀
    const dateStr = dateOverride || getFormattedDate();
    const prefix = `viiyd${dateStr}${projectCode.toLowerCase()}`;

    console.log(`🏷️  命名前缀: ${prefix}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // 创建重命名映射
    const processMap = [];

    files.forEach((file, index) => {
        const num = String(index + 1).padStart(2, '0');
        const mainName = `${prefix}_${num}.webp`;
        const webName = `${prefix}_${num}_web.webp`;

        processMap.push({
            oldPath: path.join(absolutePath, file),
            mainPath: path.join(absolutePath, mainName),
            webPath: path.join(absolutePath, webName),
            oldName: file,
            mainName: mainName,
            webName: webName
        });
    });

    console.log('🖼️  Processing and Converting to WebP...');
    
    for (const item of processMap) {
        try {
            // 1. Generate High-Res Original (Original Dimensions, 90% Quality)
            await sharp(item.oldPath)
                .webp({ quality: 90 })
                .toFile(item.mainPath);
            
            // 2. Generate Optimized Web Version (1600px, 80% Quality)
            await sharp(item.oldPath)
                .resize({ width: 1600, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(item.webPath);

            // Delete old file if names differ (to avoid cluttering need_upload)
            if (item.oldPath !== item.mainPath && item.oldPath !== item.webPath) {
                fs.unlinkSync(item.oldPath);
            }

            console.log(`   ✅ ${item.oldName} -> ${item.mainName} (+ _web.webp)`);
        } catch (err) {
            console.error(`   ❌ Failed: ${item.oldName} - ${err.message}`);
        }
    }

    console.log(`\n✅ 成功处理 ${files.length} 张图片`);

    // R2 Path info
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);

    console.log(`\n📎 R2 上传路径推荐:`);
    console.log(`   viiyd-art-photos/${year}/${month}/${projectCode.toLowerCase()}/`);

    console.log(`\n🔗 URL 格式示例 (Lightbox 使用):`);
    console.log(`   https://photo.viiyd.com/${year}/${month}/${projectCode.toLowerCase()}/${prefix}_01.webp`);

    // 输出 lightbox shortcode 示例
    console.log(`\n📝 Hugo shortcode 示例 (确保 Frontmatter 开启 optimized: true):`);
    console.log(`<div class="image-grid">`);
    processMap.slice(0, 3).forEach(item => {
        const url = `https://photo.viiyd.com/${year}/${month}/${projectCode.toLowerCase()}/${item.mainName}`;
        console.log(`{{< lightbox src="${url}" title="" >}}`);
    });
    if (processMap.length > 3) {
        console.log(`... (共 ${processMap.length} 张)`);
    }
    console.log(`</div>`);
}

// 执行
const args = process.argv.slice(2);
renameImages(args[0], args[1], args[2]);
