# VIIYD 4.0 占位登记表

> 改版期间所有"暂时写死 / 等素材 / 等拍板"的地方登记在此。**上线前必须清空 ⛔ 与 ⚠️ 两档。**
> 每项写清：占位在哪、当前用什么顶着、解锁需要什么、谁来解。
> 状态：⛔ 阻塞上线 · ⚠️ 可上线但不完整 · 🔧 开发期临时物

| # | 项目 | 位置 | 当前占位值 | 解锁需要 | 谁 | 状态 |
|---|---|---|---|---|---|---|
| P1 | 等级系数 | `data/pricing.yaml` | ×1.0 / 1.8 / 3.0 / 5.0（设计稿占位） | 真实工时推算 | 用户 | ⛔ |
| P2 | 体型倍数 | `data/pricing.yaml` | ×1 / 1.5 / 2.5 / 6 / 20 | 真实工时推算 | 用户 | ⛔ |
| P3 | EIU 基数 | `data/pricing.yaml` | `1 EIU = ¥40` | 确认是否为最终值 | 用户 | ⛔ |
| P4 | 各单 `eiu` 字段 | `content/work/*/index.md` | 未写入 | P1+P2 定案后脚本回填 | 脚本 | ⛔ |
| P5 | ¥40 边界（含不含组装/地台/回寄） | 不上站，仅内部 | 无 | 用户自己先有答案，微信里口径一致 | 用户 | ⚠️ |
| P6 | 档期文案 | `data/schedule.yaml` | "2026.11 起 · 两个展示位开放中" | 真实档期 | 用户 | ⚠️ |
| P7 | 微信号明文 | `data/contact.yaml` `wechat_id` | 留空 → 「复制微信号」按钮**自动不渲染**，不显示假号码 | 填入即自动出现，不必改模板 | 用户 | ⚠️ |
| P8 | 微信二维码 | `static/img/mywechat.jpg` | 沿用 3.0 现有图 | 确认是否为最终版 | 用户 | ⚠️ |
| P9 | 关于页资历四格 | `i18n/*.toml` `about_stat_*` | 2024 / 52 / 400+ / 2（设计稿占位） | 真实数字 | 用户 | ⚠️ |
| P10 | 渠道链接 | `data/contact.yaml` `channels` | 只有 Instagram | 小红书 / B站 链接，填空的不渲染 | 用户 | ⚠️ |
| P11 | 各单 `system` 分类 | `content/work/*/index.md` | 53/56 已由脚本推导写入 | 人工校对；另有 3 单脚本判不了，见下方「P11 待定明细」 | 用户 | ⚠️ |
| P12 | 各单 `models` 构成描述 | `content/work/*/index.md` | 脚本按 model_count 生成 | 人工润色 | 用户 | ⚠️ |
| P13 | `featured` 首页 6 单 | `content/work/*/index.md` | 默认取最近 6 单 | 人工挑选 | 用户 | ⚠️ |
| P14 | FAQ 第 1 条（EIU） | `i18n/zh.toml` `faq_1_a` | 已按交接包 §19 只答一半 | 正式答案（EIU 那条按交接包 §19 只答一半） | 用户 | ⚠️ |
| P15 | 中文字体子集 | `scripts/build_fonts.js` | 暂用 Google Fonts CDN。**脚本已写但走不通**（见脚本末尾「实测阻碍」）。实测代价：那份 @font-face CSS 压缩后仍 **124KB**，是站点自身 CSS+JS+HTML 合计（30KB gzip）的 4 倍 | 装 fonttools 或 subset-font + 决定 30MB 源字体放哪 | 用户拍板后我做 | ⚠️ |
| P16 | 图片占位条纹 | 各模板 | `repeating-linear-gradient(135deg,#15191b 0 8px,#1b2023 8px 16px)` | 换 R2 实拍 | 开发 | 🔧 |
| P17 | ~~僵尸依赖 tailwindcss~~ | — | **已解决**：`npm uninstall tailwindcss @tailwindcss/postcss` | — | — | ✅ |
| P18 | ~~`public/css/` 陈旧产物~~ | — | **已解决**：`rm -rf public` 重建后归零 | — | — | ✅ |
| P20 | 各单交付说明正文 | `content/work/*/index.md` | 暂用 `summary` 一句顶着 | 56 单各写 3–5 段「客户想要什么 / 判断了什么 / 难点在哪」 | 用户 | ⚠️ |
| P21 | 旧正文 `.Content` 残骸 | `content/work/*/index*.md` 正文区 | 不渲染，原样留在文件里 | 决定是清空还是改写成 P20 的正文 | 用户 | ⚠️ |
| P22 | 关于页自述三段 | `i18n/*.toml` `about_bio_1..3` | 我按语气拟了三段，**不是你写的** | 你本人重写（第一人称、讲怎么开始、接什么不接什么） | 用户 | ⚠️ |
| P23 | 设备与工艺明细 | `i18n/*.toml` `about_kit_*` | 喷笔/光箱/地台三项写「待补充」 | 真实型号与品牌 | 用户 | ⚠️ |
| P24 | FAQ 第 2–4 条答案 | `i18n/zh.toml` `faq_2..4_a` | 写「待补充」 | 寄件保价、分批交付、配色复刻的正式答案 | 用户 | ⚠️ |
| P19 | ~~旧 `main.css`~~ | — | **已解决**：确认零引用后删除 | — | — | ✅ |

## P11 待定明细（3 单）

脚本按 tags 推导 system，判不了的不猜，留空等人工：

| slug | tags | 问题 |
|---|---|---|
| `pink-horrors-tzeentch-chaos-daemons` | Warhammer, Tzeentch, Chaos Daemons | 提词者恶魔 40K 与 AoS 都有，tags 里没有能区分的线索 |
| `screamers-of-tzeentch-chaos-daemons` | Warhammer, Tzeentch, Chaos Daemons | 同上 |
| `warhammer-painting-beginner-guide` | Warhammer, Painting Guide, Tutorial | **这不是委托单，是文章**。需决定：给它一个 system，还是把文章排除出作品档案库 |

回答后直接在对应 `index.md` / `index.zh.md` 补 `system:` 行即可，或告诉我值我来写。

## 解锁顺序建议

`P1+P2+P3` 是一组，一次拍板 → 解锁 `P4` 脚本回填 → 解锁计划阶段 4（服务与计价页）。这是唯一的硬闸门。
其余各项都不阻塞开发，只阻塞"上线时页面是否完整"。

| P26 | 涂装指南正文 | `content/work/warhammer-painting-beginner-guide/index*.md` | 正文是 3.0 的 Tailwind 卡片标记（未编译 → 纯文本堆叠，可读但无样式） | 改写成 4.0 的普通 Markdown | 用户 | ⚠️ |
| P27 | 6 个已废弃脚本 | `scripts/` | 已加 ⚠️ DEPRECATED 头，未删除 | 你确认后可删（`migrate_work.js` 尤其危险，跑了会破坏 4.0 front matter）| 用户 | 🔧 |
| P28 | 朱砂按钮的白字对比度 | `assets/css/components.css` `.btn-action` | 白字在 `#FF4C00` 上 **3.34:1**，WCAG AA 要 4.5:1（13.5px/500 属普通文本，不适用大字豁免） | 三选一：① 字色改 `--ink`（5.67:1，达标但改变品牌观感）② 字号加粗到 ≥18.66px bold（走大字 3:1 门槛）③ 接受不达标。**改主 CTA 的观感该你拍板** | 用户 | ⚠️ |
| P29 | ~~涂料链接的误触面积~~ | — | **已解决**：整行 `<a>` 改 `<div>`，只有涂料名可点 | 若你更想要纯展示（完全去掉外链）告诉我 | — | ✅ |
| P30 | ~~灯箱工具栏按钮 <44px~~ | — | **已解决**：加 `.lb-btn` 类交给 CSS，移动端 44×44，桌面观感不变 | — | — | ✅ |
| P31 | iOS 背景滚动锁不住 | `lightbox.js` / `commission-modal.html` | `body.style.overflow='hidden'` 在 iOS 无效 | 需 `position:fixed + top:-scrollY` 方案，改动面较大 | 开发 | 🔧 |
| P25 | `static/` 里的 3.0 死资源 | `static/stock/` `static/img/` | 约 25MB 无人引用但每次部署都上传 | 你确认哪些可删（都在 git 里，可恢复） | 用户 | 🔧 |

## 已解决（保留记录）

- **P17** 僵尸依赖 tailwindcss → 已卸载
- **P18** `public/css/` 陈旧产物 → 清空重建后归零
- **P19** 旧 `main.css` → 确认零引用后删除
- **额外**：询价浮层里残留的 3.0 价格（`¥120+` / `¥600+`）已改为 4.0 五等级枚举，
  英文站价格泄漏 146 → 0
- **额外**：`layouts/_default/{list,single}.html` 两个 3.0 死模板已删（产物 md5 验证无变化）
- **额外**：关于页原始 JPEG 停止发布（`_build.publishResources: false`），
  产物 **157MB → 49MB**，`public/about` 从 109MB 降到 556KB
- **额外**：`/services/` `/about/` 补上 JSON-LD（Service / AboutPage），**不含任何数字**
- **额外**：163 个孤儿 i18n key 已删（双语 379 行，产物 md5 验证无变化）

## 变更记录

- 2026-09-02 建表（P1–P16）
- 2026-09-03 P17 / P19 解决（卸载 tailwind、删除 main.css）；P15 实测走不通，路径已记录在 `scripts/build_fonts.js` 末尾
- 2026-09-03 P18 解决；P7/P9/P10/P14 更正为实际落地位置
- 2026-09-03 新增 P22–P24（首页/关于页/FAQ 的文案占位，均为我拟稿，需你本人定稿）
- 2026-09-02 新增 P20–P21（详情页重写时暴露：旧正文是重复图集 + 未编译 Tailwind 块，不是可用的交付说明）
- 2026-09-02 新增 P17–P19（阶段 1 切换时暴露的历史残留）
- 2026-09-02 P11 部分解决：`scripts/migrate_4_0.js` 已为 53/56 单写入 `system`，56 单全部写入 `delivered`；余 3 单见上表
