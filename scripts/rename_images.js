/**
 * VIIYD Image Rename Script
 * 
 * 用途: 将相机原始文件名批量重命名为 VIIYD 标准格式
 * 格式: viiyd[YYYYMMDD][CODE]_[NN].jpg
 * 
 * 用法:
 *   node scripts/rename_images.js [source_folder] [project_code]
 * 
 * 示例:
 *   node scripts/rename_images.js ./need_upload lion
 *   结果: viiyd20260120lion_01.jpg, viiyd20260120lion_02.jpg, ...
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 支持的图片扩展名
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG'];

function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

async function renameImages(sourceFolder, projectCode) {
    // 验证参数
    if (!sourceFolder || !projectCode) {
        console.error('❌ 用法: node rename_images.js [source_folder] [project_code]');
        console.error('   示例: node rename_images.js ./need_upload lion');
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
    const dateStr = getFormattedDate();
    const prefix = `viiyd${dateStr}${projectCode.toLowerCase()}`;

    console.log(`🏷️  命名前缀: ${prefix}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // 创建重命名映射（先收集，再执行，避免冲突）
    const renameMap = [];

    files.forEach((file, index) => {
        const num = String(index + 1).padStart(2, '0');
        const ext = path.extname(file).toLowerCase();
        const newName = `${prefix}_${num}${ext}`;

        renameMap.push({
            oldPath: path.join(absolutePath, file),
            newPath: path.join(absolutePath, newName),
            oldName: file,
            newName: newName
        });
    });

    // 显示预览
    console.log('📋 重命名预览:');
    renameMap.forEach(item => {
        console.log(`   ${item.oldName} → ${item.newName}`);
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 检查是否有冲突（目标文件已存在）
    const conflicts = renameMap.filter(item =>
        fs.existsSync(item.newPath) && item.oldPath !== item.newPath
    );

    if (conflicts.length > 0) {
        console.error('\n⚠️  检测到文件名冲突:');
        conflicts.forEach(c => console.error(`   ${c.newName} 已存在`));
        console.error('\n请先清理冲突文件后重试');
        process.exit(1);
    }

    // 执行重命名
    let successCount = 0;
    renameMap.forEach(item => {
        try {
            fs.renameSync(item.oldPath, item.newPath);
            successCount++;
        } catch (err) {
            console.error(`❌ 重命名失败: ${item.oldName} - ${err.message}`);
        }
    });

    console.log(`\n✅ 成功重命名 ${successCount}/${files.length} 张图片`);

    // Generate web-optimized versions
    console.log('\n🖼️  Generating web-optimized versions...');
    for (const item of renameMap) {
        const webPath = item.newPath.replace(/\.(jpg|jpeg|png)$/i, '_web.$1');
        // Only generate if not exists or if we want to overwrite (currently skipping check implies overwrite logic or fresh run)
        // Since we just renamed the main file, web file shouldn't exist unless previous run left it.
        try {
            await sharp(item.newPath)
                .resize({ width: 1600, withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toFile(webPath);
            console.log(`   ✅ ${path.basename(webPath)}`);
        } catch (err) {
            console.error(`   ❌ Failed: ${path.basename(item.newPath)} - ${err.message}`);
        }
    }

    // R2 Path info
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    console.log(`\n📎 R2 上传路径推荐:`);
    console.log(`   viiyd-images/${year}/${month}/${projectCode.toLowerCase()}/`);

    console.log(`\n🔗 URL 格式示例:`);
    console.log(`   https://photo.viiyd.com/${year}/${month}/${projectCode.toLowerCase()}/${prefix}_01.jpg`);

    // 输出 lightbox shortcode 示例
    console.log(`\n📝 Hugo shortcode 示例:`);
    console.log(`<div class="image-grid">`);
    renameMap.slice(0, 3).forEach(item => {
        const url = `https://photo.viiyd.com/${year}/${month}/${projectCode.toLowerCase()}/${item.newName}`;
        console.log(`{{< lightbox src="${url}" title="" >}}`);
    });
    if (renameMap.length > 3) {
        console.log(`... (共 ${renameMap.length} 张)`);
    }
    console.log(`</div>`);
}

// 执行
const args = process.argv.slice(2);
renameImages(args[0], args[1]);
