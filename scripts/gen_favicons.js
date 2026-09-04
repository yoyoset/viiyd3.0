// 一次性脚本：从 assets/img/panda-mark.png 生成 static/ 下的整套 favicon 文件。
// ICO 用 PNG 帧手工打包（Vista+ 都支持），不引入额外依赖。
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'assets', 'img', 'panda-mark.png');
const OUT = path.join(__dirname, '..', 'static');

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    offset += buf.length;
    dirEntries.push(entry);
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buf)]);
}

async function main() {
  const targets = [
    { file: 'favicon-16x16.png', size: 16 },
    { file: 'favicon-32x32.png', size: 32 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'android-chrome-192x192.png', size: 192 },
    { file: 'android-chrome-512x512.png', size: 512 },
  ];

  for (const t of targets) {
    const buf = await sharp(SRC).resize(t.size, t.size).png().toBuffer();
    fs.writeFileSync(path.join(OUT, t.file), buf);
    console.log(`wrote ${t.file} (${buf.length} bytes)`);
  }

  const icoSizes = [16, 32, 48];
  const icoBufs = [];
  for (const size of icoSizes) {
    const buf = await sharp(SRC).resize(size, size).png().toBuffer();
    icoBufs.push({ size, buf });
  }
  const ico = buildIco(icoBufs);
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);
  console.log(`wrote favicon.ico (${ico.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
