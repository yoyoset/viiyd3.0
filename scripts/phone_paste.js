/**
 * 把一段文字（中文也行）粘贴进手机当前聚焦的输入框
 *
 * 用法:
 *   node scripts/phone_paste.js <file>          # 粘贴文件内容（UTF-8）
 *   node scripts/phone_paste.js --text "你好"   # 粘贴一段文字
 *   加 --no-paste  只写剪贴板，不粘贴
 *
 * 为什么: adb shell input text 只能发 ASCII，中文只能靠 Gboard 拼音猜，
 * 实测一条小红书打了 25 分钟（2026-09-28）。Android 14 没有写剪贴板的 shell 命令，
 * 这里借 scrcpy 的手机端服务：它以 shell 身份跑 app_process，有权限写剪贴板，
 * 收到 SET_CLIPBOARD(paste=1) 后会自己注入 KEYCODE_PASTE。
 * 不用 scrcpy 客户端，是因为客户端只在它窗口里按 Ctrl+V 时才把电脑剪贴板推给手机。
 *
 * 协议（scrcpy v4.1，server/.../control/ControlMessageReader.java）:
 *   [u8 type=9][u64 sequence][u8 paste][u32 len][utf8 text]，大端；
 *   sequence 非 0 时手机回 ACK_CLIPBOARD [u8 type=1][u64 sequence]，收到才算完成。
 * 服务端版本号必须与 jar 完全一致，升级 scrcpy 时同步改 VERSION。
 */
const fs = require('fs');
const net = require('net');
const { execFileSync, spawn } = require('child_process');

const ADB = process.env.ADB || 'F:/my_ai/pixel/platform-tools/adb.exe';
const SERVER_LOCAL = process.env.SCRCPY_SERVER || 'F:/my_ai/pixel/scrcpy/scrcpy-server';
const VERSION = '4.1';
const SERVER_REMOTE = `/data/local/tmp/scrcpy-server-v${VERSION}.jar`;
const PORT = 27199;

const args = process.argv.slice(2);
const paste = !args.includes('--no-paste');
const ti = args.indexOf('--text');
const file = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--text');
const text = ti >= 0 ? args[ti + 1] : file ? fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '') : null;
if (!text) { console.error('用法: node scripts/phone_paste.js <file> | --text "..." [--no-paste]'); process.exit(2); }

const adb = (...a) => execFileSync(ADB, a, { encoding: 'utf8' });

function ensureServer() {
    const has = adb('shell', `ls ${SERVER_REMOTE} 2>/dev/null || true`).trim();
    if (!has) adb('push', SERVER_LOCAL, SERVER_REMOTE);
}

function connect(retries) {
    return new Promise((resolve, reject) => {
        const s = net.connect(PORT, '127.0.0.1');
        s.once('data', () => resolve(s));          // 第一个字节是 dummy byte，说明服务端真的接上了
        s.once('error', reject);
        s.once('close', () => reject(new Error('closed before dummy byte')));
    }).catch(e => retries > 0
        ? new Promise(r => setTimeout(r, 200)).then(() => connect(retries - 1))
        : Promise.reject(e));
}

async function main() {
    ensureServer();
    const scid = (Math.random() * 0x7fffffff) >>> 0;
    const sock = `scrcpy_${scid.toString(16).padStart(8, '0')}`;
    adb('forward', `tcp:${PORT}`, `localabstract:${sock}`);
    const server = spawn(ADB, ['shell',
        `CLASSPATH=${SERVER_REMOTE} app_process / com.genymobile.scrcpy.Server ${VERSION}`,
        `scid=${scid.toString(16)}`, 'log_level=warn', 'tunnel_forward=true',
        'video=false', 'audio=false', 'control=true', 'send_device_meta=false',
        'cleanup=false', 'power_on=false', 'clipboard_autosync=false'], { stdio: ['ignore', 'ignore', 'inherit'] });

    let s;
    try {
        s = await connect(25);
        const body = Buffer.from(text, 'utf8');
        const msg = Buffer.alloc(1 + 8 + 1 + 4);
        msg.writeUInt8(9, 0);
        msg.writeBigUInt64BE(1n, 1);
        msg.writeUInt8(paste ? 1 : 0, 9);
        msg.writeUInt32BE(body.length, 10);
        const acked = new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('没有收到 ACK_CLIPBOARD')), 5000);
            s.on('data', d => { if (d[0] === 1) { clearTimeout(t); resolve(); } });
        });
        s.write(Buffer.concat([msg, body]));
        await acked;
        console.log(`${paste ? '已粘贴' : '已写入剪贴板'}：${[...text].length} 字`);
    } finally {
        if (s) s.destroy();
        server.kill();
        try { adb('forward', '--remove', `tcp:${PORT}`); } catch { }
    }
}

main().catch(e => { console.error('失败:', e.message); process.exit(1); });
