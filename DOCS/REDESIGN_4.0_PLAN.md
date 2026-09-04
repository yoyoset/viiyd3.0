# VIIYD 4.0 改版计划

> 依据：`# VIIYD品牌网站设计.zip` → `handoff/` 三份文档 + 四份 `.dc.html` 视觉稿。
> 对象：现仓库 `viiyd3.0`（Hugo + CF Pages + R2，56 个双语作品页已上线并被索引）。
> 编写日期：2026-09-02。

本计划不是把交接包复述一遍，而是回答三件事：**现状与设计稿差在哪、哪些地方交接包和现有资产冲突需要拍板、按什么顺序落地。**

---

## 0. 一句话结论

4.0 是**视觉系统全换 + 商业模型换轨（三套矛盾价格 → 单一 EIU）**，不是改版式微调。
前端约 80% 重写；**内容资产（56 单 × 双语 × R2 图库）100% 保留**，靠一次性迁移脚本补字段。
真正的关键路径不是代码，是**定价系数拍板**——没有它，服务页与估算器（4.0 的核心卖点）无法上线。

---

## 1. 现状 vs 设计稿 · 差异盘点

| 维度 | 现状（3.0） | 设计稿（4.0） | 工作量 |
|---|---|---|---|
| 色彩 | 米白纸质底 `#fafaf6` + 帝国金 `#f5c64a`，带 light/dark 双主题 | 墨屏单一暗底 `#0E1113`，六色锁定（天水碧/朱砂/缃色/月白/墨灰） | **全换**。删掉 `prefers-color-scheme` 双主题分支 |
| 字体 | Instrument Serif + Geist + Geist Mono | Noto Serif SC 900/700 + Noto Sans SC + IBM Plex Mono（Instrument Serif 仅保留拉丁 display） | **全换** + 中文子集化（见 §5 风险） |
| CSS | `assets/css/main.css` 686 行单文件 | `tokens.css` / `base.css` / `components.css` 三层 | 重写，可保留 optimized-image 等结构性代码 |
| 样式写法 | 模板里大量内联 `style=""`（commission-modal 657 行几乎全内联） | 组件化 class | 需要把内联样式收回 CSS |
| 圆角/阴影 | 有阴影（modal `box-shadow: 0 30px 80px`）、有圆角 | **全站 0 圆角 0 阴影**，唯一例外 Legend 2px 金色内嵌线 | 逐处清 |
| **版式宽度** | `--page-width: 1280px` 有容器，但作品/首屏区块突破成全宽 | 设计稿要求全宽无容器 | **不采纳设计稿**，见 §2-E |
| 作品列表 | 表格式 archive-row + 按 faction 单维筛选 | 4 列卡片网格 + **游戏类型 × 涂装等级 双维 chips**（带构建期计数） | 重写 + 新增 `works/index.json` |
| 列表视图 | 只有表格式一种 | 只有网格式一种 | **两种都要**，可切换，见 §2-F |
| 价格体系 | **三套并存且矛盾**：list 页 ¥120/¥600 每模型、rates 页另一套、painter 页第三套 | **单一 EIU**：`1 EIU = ¥40` + 体型倍数 + 等级系数，全站只出现这一行数字 | 拆旧建新，涉及 i18n 两份 toml |
| 服务页 | `/rates` + `/process` 两个孤岛页（审计已列为 P0） | 合并为一页「服务与计价」：四级卡 + Legend 通栏 + 体型倍数 + **估算器** + 流程 + FAQ | 新建，估算器是新功能 |
| 询价 | 弹窗：QR 优先 → 可切表单 → Worker → D1 → Telegram（工作正常） | 只留微信浮层，「不做第二套表单」 | **需拍板**，见 §2-C |
| 详情页 | plates 网格由 `photos: N` 推导，灯箱三级加载 | 主图 + 双列（正文 / 规格块）+ 图集网格 + 相邻推荐 | 重排版，**图片加载契约必须原样保留** |
| 关于页 | 有内容，已有 10 张实景照素材（`content/about/_WER*.jpg`，未用） | 以图为主，实景大图 + 设备工艺列表 + 资历条 | 重写，素材已有 |
| 语言 | `defaultContentLanguage = en`，EN 无子目录（EN 在根，ZH 在 `/zh/`） | 中文优先 | **需拍板**，见 §2-A |

**顺手解决的历史债**：`/rates`、`/process` 孤岛化、三套矛盾价格、painter 页与 SEO 主打自相矛盾（NMM）——这些是 2026-07 审计的 P0，4.0 的信息架构天然覆盖。

---

## 2. 动工前必须拍板的四件事

这四条会改变实现方式，不是实现细节。

### A. 语言默认值：**建议不翻转**（保持 EN 在根）

交接包写「中文优先」。但现站 `defaultContentLanguage = 'en'` + `defaultContentLanguageInSubdir = false`，意味着 **56 个作品页的英文版占着根 URL 且已被索引**。翻转成中文优先 = 全站 URL 位移，需要一整套 301 + hreflang 重做，SEO 代价高于收益。

建议：**URL 结构不动**，"中文优先"落在其它三处——① 按浏览器语言/地域首访自动跳 `/zh/`；② 中文站承载完整成交漏斗、英文站按交接包 §12 精简；③ 所有渠道投放链接直接指向 `/zh/...`。

### B. 路径命名：**建议保留 `/work/`，不改 `/works/`**

交接包用 `/works/`。现站是 `/work/`，56 页已索引。语义无差别，改名纯亏。设计稿里所有 `works` 一律读作 `work`。

### C. 询价表单：**建议保留为次级入口，不删**

交接包 §13 说「三个入口指向同一浮层，不做第二套表单」。但现站表单是**已跑通的 Worker → D1 → Telegram 链路**，且英文站没有微信、必须有表单兜底。

建议：浮层默认态 = 二维码 + 复制微信号（符合设计稿）；「没有微信？」按钮展开表单为第二态（EN 直接落表单态）。这不违反「不做第二套表单」——仍是同一个浮层实例，只是多一个状态。

### D. 定价系数：**卡在用户侧，是唯一硬闸门**

设计稿里的 ×1.0/1.8/3.0/5.0 与体型 ×1/1.5/2.5/6/20 都标注为占位值。估算器、四级服务卡、每个作品的 `eiu` 字段全部依赖它。
**这项不解决，§4 的第 4 阶段无法启动。** 其余阶段可并行推进。

### E. 全宽改限宽 —— **推翻设计稿 §5 第一条**

设计稿写「内容不设 max-width 容器 —— 全宽是这套语言的一部分」。**这条不采纳。**

理由：宽屏/全屏下单张图被拉到 2000px 以上，观感是「满屏」而不是「震撼」——在震撼与效率之间，它两头都不占。而且每个模型的成图比例天然不同（现有素材已有 1:1 与 4:3，未来还会有 16:9 的小队合影和 9:16 的单体长竖），全宽会把这种差异放大成视觉失控。

做法：全站统一 `--content-max: 1440px` 居中（对齐设计稿 1440 画布宽），页边距 40px / 移动 20px 不变。限宽之后比例问题自然收敛——图片在有界容器里按自然比例排布，不需要额外的等高行/瀑布流机制。
- 列表卡片：**统一裁切比例**（网格要的是整齐）
- 详情页主图 / 首屏 / 灯箱：**保留原始比例**，配 `max-height: 80vh` + `object-fit: contain` 防止长竖图撑破屏幕

### F. 作品档案页要两种视图

网格（图卡）和列表（信息密度高、一屏看更多）各有人用，不二选一。做成一个视图切换器，偏好存 `localStorage`，两种视图共用同一批 DOM 数据与筛选状态。
现站的 archive-row 表格式正好是列表视图的雏形，设计稿的 4 列卡片是网格视图——两边资产都不浪费。

---

## 3. 内容模型迁移

现有 front matter 已有：`title / date / cover / photos / tier / time_log / model_count / tags / summary / optimized`。
4.0 新增需求字段：

| 字段 | 来源 | 做法 |
|---|---|---|
| `system` | 从 `tags` 推导（Warhammer 40k / Old World / AoS / Kill Team / JoyToy / Other） | 脚本映射 + 人工校对 56 条 |
| `delivered` | 从 `date` 取 `YYYY.MM` | 脚本自动，零人工 |
| `eiu` | `model_count × 体型倍数 × 等级系数` | **依赖 §2-D**。系数定了再跑脚本回填 |
| `models` | 从 `model_count` + `tags` 生成一行描述 | 半自动，需人工润色 |
| `extras` | 无来源 | 默认空数组，按需人工补 |
| `featured` | 无来源 | 默认 false，人工挑 6 单上首页 |

**不引入 `gallery` 字段**——交接包的 `gallery: [...]` 与现站「`photos: N` 推导 `_01.._NN`」的约定冲突。现有约定已被 audit 脚本与 pre-commit 守着，保留它，图集网格照旧从 `photos` 推导。

产出：`scripts/migrate_4_0.js`（幂等、可重跑、只增字段不动已有值），并给 `scripts/audit_content.js` 加三条新校验（MissingSystem / InvalidSystem / MissingEiu）。

---

## 4. 实施阶段

交接包给的顺序适用于从零起步。此处按「现站有 56 篇存量内容 + 有正在带客的转化链路」调整：**先地基，再内页，最后才动首页与漏斗**——保证任何一个阶段中断，站点仍是可上线状态。

### 阶段 0 · 地基（无视觉可见变化）
- `tokens.css` 落地六色 + 字阶 13 级 + 间距
- 字体方案定案：Noto Serif SC 子集化自托管（`static/fonts/`），Google Fonts 仅作英文站兜底
- `scripts/migrate_4_0.js` + audit 新规则，56×2 篇内容补齐 `system` / `delivered`（`eiu` 留空待 §2-D）
- ~~构建期生成 `/work/index.json`~~ —— **取消，改用 DOM data 属性**（见 §8 实施日志 2026-09-02）
- **验收**：`npm run build` 全绿，站点外观无变化，index.json 字段完整

### 阶段 1 · 骨架（视觉换轨开始）
- `base.css` + `components.css`；顶栏 / 页脚 partial 按 §4.1/4.10 重写
- **落地 `--content-max: 1440px` 居中容器**（§2-E），全站区块一律套用，不留全宽突破口
- 全站清圆角、清阴影、内联样式收回 class
- **验收**：全站底色转墨屏，导航与页脚符合稿；`hugo --gc --minify` 后 grep `public/` 无残留 `border-radius`/`box-shadow`

### 阶段 2 · 作品档案页 + 详情页（流量最大的两页）
- **网格 / 列表双视图切换**（§2-F），偏好存 `localStorage`，与筛选状态互不干扰
- 网格视图 4 列卡片 + 双维 chips（**计数由 Hugo 构建期统计写死**，不靠 JS）
- `filter.js`：读卡片上的 `data-system` / `data-tier` 做显隐 + `history.replaceState`；Hugo 直出全量列表，JS 失效也能看
- 静态兜底分类页 `/work/tier/master/`、`/work/system/40k/` —— **兼作 SEO 落地页与小红书/IG 投放落点**（交接包 §03-5）
- 详情页重排：主图 + 双列 + 图集 + 相邻推荐；主图保留原始比例 + `max-height: 80vh`（§2-E）
- **验收**：2560px 宽屏下无任何区块突破 1440 容器；两种视图切换后筛选结果一致；三级图片加载契约未破（列表 cdn-cgi 缩放 / 页面 `_web` / 灯箱点击才取原图）；`lightbox-trigger` 数量 = `photos`；无 `ZgotmplZ`；列表页图片总重 < 1.2MB
- ⚠️ 这一阶段最容易踩 `CLAUDE.md` 里那条 60MB 事故：**任何 photo.viiyd.com 图片必须过 `optimized-image` partial**

### 阶段 3 · 灯箱 + 微信浮层
- 灯箱按 §4.8 重做外观（顶行 `3 / 8`、底部常驻「同款询价」），**内部取图逻辑（`data-web-src` / `data-full-res`）一字不改**
- 微信浮层重构：现 657 行内联 modal → 组件化，QR 态 + 表单态双状态，三入口共用，带 `?from=` 来源标记
- **验收**：微信内置浏览器实测（长按识别二维码、无 hover 依赖、无新窗口）

### 阶段 4 · 服务与计价页 ⛔ 依赖 §2-D
- 四级服务卡 + Legend 通栏 + 体型倍数列表 + FAQ
- `estimator.js`：只输出 EIU 不换算金额；>40 EIU 追加分批交付提示；Legend 不入四格
- 旧 `/rates`、`/process` 内容并入，旧 URL 做 301
- 全站清除 ¥120/¥600 旧价体系（含 `i18n/en.toml`、`i18n/zh.toml`）
- **验收**：全站 grep 不到旧价格串；估算器在 2×2 移动布局下可用

### 阶段 5 · 首页 + 关于页
- 首页：首屏（**限宽内的大图，非全幅**，§2-E）→ 定义句（86px 纵向留白，**不压缩**）→ 最近交付 6 单 → 等级速览 → 结尾双卡（计价 / 档期）
- 档期文案外置到 `data/schedule.yaml`，可不改模板更新
- 关于页启用已有 10 张实景照素材
- **验收**：LCP < 2.5s (4G)；首屏图 `fetchpriority="high"`，其余 `loading="lazy"`

### 阶段 6 · 移动端 + 英文站精简
- 按交接包 §17 逐区块表过一遍；所有可点区域 ≥44px
- 英文站按 §12 关掉 EIU 框、估算器、寄件 FAQ；询价入口改 Instagram + 邮件
- **验收**：真机微信内打开全流程；EN 页面 grep 不到 EIU 数字

---

## 5. 风险与红线

**红线（改动前必须理解，见 `CLAUDE.md`）**
1. **图片三级加载架构不可破坏**——4.0 的 640w/2400w 说法要映射到现有的 `cdn-cgi width=` / `_web` / 原图三级，不是另起一套。
2. **灯箱契约不可破坏**——`.lightbox-trigger` 类 + `data-web-src` / `data-full-res` 属性，两处产出点都要保留。
3. **`photos: N` 推导 plates 的逻辑不可换成 `gallery` 数组**。
4. pre-commit（audit + URL 空格检查）不绕过。

**风险**
| 风险 | 说明 | 对策 |
|---|---|---|
| 中文字体体积 | Noto Serif SC 900 全量 >8MB，是 4.0 最大的性能风险 | 按站内实际用字生成子集，目标 <400KB；`font-display: swap` 回退 serif；标题字重只要 900，正文用 Sans |
| 视觉换轨期间站点半新半旧 | 阶段 1 之后、阶段 5 之前，首页还是旧视觉 | 按阶段顺序保证每阶段结束都可上线；或整轮在 feature 分支做，一次性合并 |
| SEO 波动 | 旧 `/rates` `/process` 退役、新增分类页 | 301 齐全 + sitemap 同步更新 + 新分类页当天提交索引 |
| 定价拍板拖延 | 阶段 4 阻塞，估算器是 4.0 的差异化卖点 | 阶段 0-3、5-6 与它无依赖，可先跑；但**上线不完整的服务页不如不上** |

---

## 6. 待用户提供（阻塞项按优先级）

1. **⛔ 等级系数与体型倍数的真实值**（阻塞阶段 4；`1 EIU = ¥40` 是否确认）
2. **⛔ ¥40 是否含组装/地台/回寄** —— 交接包 §19 说网站故意不写，但**你自己必须先有答案**才能在微信里一致地回答
3. 微信号明文 + 二维码图（现有 `/img/mywechat.jpg` 是否为最终版）
4. 当前档期文案（写进 `data/schedule.yaml`）
5. 关于页资历四格真实数字（接单起始年 / 已交付单数 / 参赛 / 合作店家）
6. 各渠道账号链接（小红书 / B站 / Instagram），用于页脚与 `?utm=` 参数
7. 56 单的 `system` 分类校对（脚本先跑，你只需过一遍错的）

---

## 7. 本次明确不做

- 不翻转默认语言、不改 `/work/` 路径（§2-A/B）
- 不删表单链路（§2-C）
- 不引入第三筛选维度「模型规模」（交接包标注为待定，两维先跑）
- 不做 CSS 框架/构建管线改造，继续手写 CSS + Hugo Pipes
- 不做瀑布流 / 等高行（justified）画廊——限宽之后不需要，徒增复杂度
- 不做新旧并存：旧模板、旧价格文案、孤岛页一次性删除或迁移，**不留兼容分支**
- 不在估算器里显示金额换算（交接包 §9 倾向不显示，采纳）
- 不动 Worker / D1 / Telegram 后端

---

## 8. 实施日志

### 2026-09-02 · 阶段 0
- `DOCS/REDESIGN_4.0_PLACEHOLDERS.md` 建表，登记 16 项占位
- `assets/css/tokens.css` 落地（六色 + 13 级字阶 + `--content-max: 1440px`）。
  **暂不接进 `head.html`** —— 新旧令牌有同名变量（`--ink` 在两边取值不同），
  阶段 0 的验收要求是「外观零变化」，接入放到阶段 1 与 `main.css` 一起换，避免半新半旧状态。
- `scripts/migrate_4_0.js` 写成并执行：56 单双语补 `delivered`（112 处字段），53 单补 `system`
- **意外收获**：27 个内容文件带 UTF-8 BOM（历史遗留）。Hugo 能吃，但任何按 `startsWith('---')`
  解析 front matter 的工具都会翻车 —— 这次就是这么被绊住的。已随迁移一并清掉。
- **顺手发现未处理**：`content/work/2026-01-23-bullgryns-.../` 目录里有 `tmp_grid.txt`、
  `tmp_head.txt` 两个残留临时文件；另 `content/about/` 有 10 张实景照与一个 `.mov` 未纳入构建。
- 验收：`audit_content.js` 全绿，`hugo --gc --minify` 成功

**取消 `/work/index.json`**（偏离交接包与本计划初稿）：
交接包设想的是「JSON 驱动前端筛选」。但既然列表由 Hugo 构建期直出全量 DOM（这是无 JS 降级的要求），
筛选只需读卡片上的 `data-system` / `data-tier` 做显隐即可 —— 再维护一份 JSON 就是同一份数据的第二个副本，
两边还会不同步。分页「加载更多」同样在已直出的 DOM 上做。
按全局工程原则「不为以后可能需要做过度设计」，删掉。日后真要做站内搜索再单独加，那时需求也更清楚。

### 2026-09-02 · 阶段 1（进行中）
- `assets/css/base.css`（136 行）：reset、`.wrap` 限宽容器、`.section` 区块节奏、13 级字阶、
  `.grid-hair` 分隔网格、图片与占位、`.fade-in`
- `assets/css/components.css`（174 行）：按钮四型、chip（含弱态/空态/反白态）、
  **视图切换器**、作品卡（网格）+ 作品行（列表）、`.frame`、Legend 条、图片蒙版
- 三个 CSS 文件均未接进 `head.html` —— 下一步与顶栏/页脚 partial 一起换，一次切完，
  避免出现「一半新令牌一半旧令牌」的中间状态
- 验收：括号配平检查通过，`hugo --gc --minify` 成功（CSS 未接入，站点外观仍为 3.0）

### 2026-09-02 · 阶段 1（视觉切换已生效）

**三个「混乱架构」的实证，都已处理：**
1. `layouts/partials/site-header.html` 是**死代码** —— 全站没有任何模板引用它，
   而每个页面模板（`index.html`、`work/list.html` …）各自内联一份 `<header>`。已删除。
2. 那份死顶栏通篇是 **Tailwind 工具类**（`max-w-7xl` `bg-neutral-900` `md:grid`），
   但 `postcss.config.js` 只挂了 autoprefixer，`main.css` 里没有 `@tailwind` 指令 ——
   **Tailwind 从未被编译过**，是 `package.json` 里的僵尸依赖（`tailwindcss` + `@tailwindcss/postcss`）。
3. `public/css/` 累积了约 70 个陈旧的 `main.min.<hash>.css`（Hugo 不删它不认识的产物）。

**本轮改动：**
- 新建 `layouts/partials/site-head.html` —— 全站唯一顶栏，由 `baseof.html` 统一渲染。
  不吸顶（吸顶会遮挡照片）；移动端汉堡 + 抽屉，语言切换收进抽屉。
- 重写 `site-footer.html`（§4.10）
- `head.html`：字体换成 Noto Serif SC 700/900 + Noto Sans SC + IBM Plex Mono + Instrument Serif；
  CSS 改为 `tokens → base → components` 三层 `resources.Concat`，**弃用 `main.css`**
- `components.css` 补顶栏/页脚样式（现 113 组括号，配平）

**验收**：`hugo --gc --minify` 成功；产物引用 `/css/viiyd.min.<hash>.css`，全站已无 `main.min` 引用；
浏览器实测 `/zh/work/` 顶栏正确（金环 logo、mono 字号字距、当前项天水碧下划线、询价边框按钮、EN/ZH）。

**⚠️ 当前站点处于迁移中间态**：顶栏与页脚已是 4.0，但各页面正文仍是 3.0 模板，
它们依赖的 `main.css` 类已不再加载，所以正文暂时无样式。这是大爆炸式换轨的必经状态 ——
**在阶段 2/5 把页面模板改完之前不要 push**。`main.css` 保留在仓库里直到最后一个消费者消失。

### 2026-09-02 · 阶段 2（作品档案页完成）
- 重写 `layouts/work/list.html`：页头 + 双维 chips + 网格/列表双视图 + 状态行 + 筛空出口
- 新增 `assets/js/archive.js`：筛选显隐 + 状态行 + URL query（`replaceState`）+ 视图切换（偏好存 `localStorage`）
- chip 计数由 Hugo 构建期 `len (where $works "Params.tier" .)` 算好写死，不靠 JS 数
- 计数为 0 的 chip 加 `disabled` + `.is-empty`；计数 ≤1 加 `.is-weak`（规格 §18 边界情况 1）

**两个真 bug，都是实测才暴露的：**
1. **`[hidden]` 被组件的 `display` 顶掉**。浏览器默认的 `[hidden]{display:none}` 优先级极低，
   `.work-card{display:flex}` / `.btn-text{display:inline-flex}` 全都能覆盖它 ——
   结果是「隐藏」的元素照常显示，筛选和视图切换全部失效。
   已在 `base.css` 加 `[hidden]{display:none!important}`。**这条不能删**，整页交互都靠它。
2. **`range` 里的 `$` 指向列表页而不是条目**。原写法 `alt="{{ $.Title }}"` 产出的是
   `alt="Works · Master"`（56 张图共用一个 alt）。因为进了 `{{ with .Params.cover }}` 之后
   `.` 是字符串，只能先在 range 里 `{{ $t := .Title }}` 捕获。现在 alt = 委托标题 + 等级。

**浏览器实测验收（全部通过）：**
- 筛选 Master → 11 条，与构建期计数一致；URL 写入 `?tier=Master`
- 组合 Legend × kill-team → 0 条，筛空出口出现，不是死胡同
- 清除筛选 → 回到 56 条，URL query 清空
- 视图切换正常，偏好写入 `localStorage`（隐私模式下 try/catch 兜住）
- **限宽验证（PLAN §2-E 的核心目的）**：viewport 2200px 时 `.wrap` 稳定在 1440px，
  卡片 4 列各 319px，不再被拉满；`body.scrollWidth` 2185 < 2200，无横向溢出

### 2026-09-02 · 阶段 2 续（详情页完成）
- 重写 `layouts/work/single.html`：面包屑 → 标题+meta → 主图 → 交付说明/规格块双列
  → 图集 3 列 → 涂料清单 → 相邻推荐（同等级 3 + 同类型 3）
- 主图按 PLAN §2-E 处理：限在 `.wrap` 内、**保留自然比例**、`max-height:80vh`。
  不同模型成图比例本来就不一样（1:1、4:3、9:16 都有），强裁毁构图，不限高则长竖图撑破一屏。
- 英文站规格块按规格 §12 改 Instagram 按钮，不出 EIU、不进询价漏斗

**红线自检（`public/zh/work/custodes-.../index.html`，photos: 37）：**
- `lightbox-trigger` 37 个 = `photos` 值 ✓
- `data-web-src` 37 / `data-full-res` 37，成对 ✓
- `ZgotmplZ` 0 处 ✓
- 页面图走 `_web.webp`（75 处），相邻推荐缩略图走 `cdn-cgi`（5 处）✓

**浏览器实测三级加载（这是 CLAUDE.md 的核心红线，必须跑过才算数）：**
- 灯箱打开 → `viiyd20260627custodes_01_web.webp`（1600px 预生成版）
- 双击放大 → `viiyd20260627custodes_01.webp`（原图，实测 714KB）
- 再双击缩小 → 切回 `_web.webp`
  三级加载完整成立：**只有用户主动要看笔触时才付出那 714KB 的流量。**

**发现：56 单的正文全是残骸。** 每篇 `.Content` 里是一整个 `<div class="image-grid">`
（10 个 `{{< lightbox >}}` 短代码，与 plates 网格完全重复）+ 若干 Tailwind 类的 HTML 块
（`bg-gradient-to-r` `rounded-r-lg` `border-gold-500`）—— 而 Tailwind 从未编译，这些块从来就没渲染对过。
这解释了 CLAUDE.md 那条「正文完全不渲染」的由来：**不是设计，是回避。**
4.0 规格 §15 要求的「交付说明正文」目前没有内容可用，暂用 `summary` 顶着（占位表 P20/P21）。

**一个排查记录**：中途误判「灯箱没打开」。实际是灯箱元素由 JS 用纯内联样式创建，
既无 id 也无 class，用 `[id*=lightbox]` 之类的选择器根本找不到它 ——
得按 `position:fixed` + `z-index:9000` 去找。放大也不是单击而是**双击**（源码里 300ms 双击判定）。

### 2026-09-03 · 阶段 3（微信浮层完成）

**先修了一个我自己埋的洞**：前几轮在顶栏/页脚/详情页发的 `data-wechat-open="..."` 按钮
一直没人监听 —— 也就是说「询价」按钮从阶段 1 起就是死的。新增 `assets/js/wechat.js`，
用**事件委托**统一绑定：以后加入口只要写 `data-wechat-open="<来源>"`，不必再改 JS。
来源写进 URL query（`?from=nav` / `work` / `footer`），对应规格 §13 的入口归因。

**浮层视觉迁移**（`commission-modal.html`，657 行内联样式）：
- 背板：渐变 + 毛玻璃 → 单一 `rgba(14,17,19,.97)`（handoff §7「不做」清单里有渐变）
- 卡片：`box-shadow: 0 30px 80px` → 1px `--hairline-strong` 框体，全站 0 阴影 0 圆角
- 标题：Instrument Serif 斜体 52px → Noto Serif SC 900 34px，强调色改天水碧
- 二维码块：**缃色实底 → 1px 框体**。缃色只给 Legend 与 logo（handoff §1 第 3 条），
  弹窗用它是越界
- 旧令牌批量迁移。**`--ink` 在两套里含义相反**：3.0 的 `--ink` 是深色文字，
  4.0 的 `--ink` 是页面底色 —— 不能盲替，按语义映射（旧 `--ink` → 新 `--fg`，
  背景用法再单独改回 `--ink`）
- 自检：旧令牌 0 残留、`border-radius`/`box-shadow` 0 处、构建无错

**转化链路原样保留**（PLAN §2-C 的决定）：只改表现层，没碰逻辑。
实测 9 个表单字段齐全（含蜜罐 `website` 与 `cf-turnstile-response`），
`/api/commission` 端点、Turnstile、文件上传全部未动。

**浏览器实测**：顶栏「询价」→ 浮层打开、ZH 落 QR 态、`?from=nav` 写入、
卡片底色 `rgb(14,17,19)`；QR ⇄ 表单双向切换正常；关闭后 `body.overflow` 正确恢复。

**未做**：灯箱**外观**仍是 3.0（`lightbox.js` 内联样式），按 §4.8 重做排在下一轮。
取图逻辑（`data-web-src` / `data-full-res`）已实测通过，那部分一个字都不会动。

### 2026-09-03 · 阶段 3 续（灯箱外观完成）
- `lightbox.js` 按 §4.8 重做外观：底色 `rgba(14,17,19,.97)`、主图 `max-height:82vh`、
  **顶行 mono 计数 `3 / 37`**、底部常驻信息行「等级 · N EIU · 交付年月」+「同款询价」
- 去掉全部圆角（原 `borderRadius:'999px'` 药丸工具条 + `50%` 圆形翻页按钮），
  实测灯箱内 `border-radius !== 0` 的元素为 **0 个**
- 淡入过渡 `0.25s` → `0.16s ease-out`（handoff §7）
- **取图逻辑一行未改**：`data-web-src` / `data-full-res` / 双击放大切原图，全部沿用

**信息行的数据来源**：模板把 `data-lb-meta` / `data-lb-cta` 写在 `.plates-grid` 上，
`lightbox.js` 只读不猜 —— 读不到就整行不显示。英文站 `data-lb-cta` 留空，
JS 自动隐藏询价按钮，天然满足规格 §12「英文站不做成交漏斗」。

**补齐 i18n**：新增 40+ 个 4.0 key（双语）。踩到一个坑：
`filter_all` / `dossier_plates_label` 等 4 个 key 与旧区块重名，
Hugo 直接报 `toml: table filter_all already exists` **构建失败**——
TOML 不允许重复表。已删掉 4.0 区块里的重名项，沿用旧定义。
补齐前 EN 站的灯箱信息行显示的是中文「交付」（走了模板里的 default 回退），
补齐后 EN = `Specialist · Delivered 2026.06`，ZH = `Specialist · 交付 2026.06`。

**入口归因链路打通**：灯箱内「同款询价」→ 同一浮层实例 + `?from=lightbox`（实测通过）。
规格 §13 的三入口已实现两个（nav / lightbox），估算器入口在阶段 4。

### 2026-09-03 · 阶段 4（服务与计价页完成）

**URL 决策**：新建 `/services/`，旧 `/rates/` `/process/` 用 front matter `aliases` 做 301。
代价为零 —— 这两页在 2026-07 止血时已被设为 `noindex` + 移出 sitemap，本来就没有索引价值。
`hugo.toml` 菜单 `pageRef` 同步改为 `services`。

- 新建 `data/pricing.yaml`：EIU 基数 / 体型倍数 / 等级系数 / 分批阈值集中一处，
  **模板与估算器都从这里读，不在任何地方写死数字**。占位表 P1–P3 拍板后只改这个文件。
- `layouts/_default/services.html`：页头 + EIU 框 + 四级卡 + Legend 通栏 + 体型倍数
  + 估算器 + 五步流程 + FAQ
- `assets/js/estimator.js`：只输出 EIU，**不换算金额**（规格 B5：最后一步仍需联系，是有意的摩擦）
- 补 90+ 个双语 i18n key

**估算器实测（公式 Σ(数量 × 体型倍数) × 等级系数）：**
- 默认 10 步兵 × Specialist(1.8) = **18** ✓
- 改 20 只 = **36** ✓
- 切 Master(5.0) = **100** ✓，超过阈值 40 → 分批交付提示自动出现 ✓
- 「+ 再加一类模型」增行正常，估算器内**不含任何 ¥ 金额** ✓

**英文站精简实测（规格 §12）**：EN 页 `EIU` 0 处、`¥40` 0 处、EIU 框 0 处，
但四级卡 13 处、Legend 条 2 处齐全 —— 正是「只列等级与交付标准，不做成交漏斗」。
ZH 页 `¥40` 恰好 1 处，是全站唯一的金额。

**排查记录（两个坑叠在一起，绕了不少路）：**
1. **未来日期**：front matter 写 `date: 2026-09-03`（无时区 → UTC 零点），
   而本地是 2026-09-03 00:29 CST = UTC 前一天 16:29 —— **日期落在未来，Hugo 直接不生成页面**。
   `hugo list all` 能列出该页、`public/` 里却没有文件，就是这个症状。改成带时区的真实时间即可。
   （这正是 memory 里那条 publishing 教训，这次栽在自己手里。）
2. **两个 hugo server 并存**：旧进程一直占着 1313 发陈旧内容，新进程退到 1314。
   浏览器拿到的是 `<!-- empty -->` 空页，而 `curl` 同一 URL 却是完整的 46KB ——
   识别线索是页面里 `livereload.js?port=1314` 与实际访问端口对不上。
   `taskkill //F //IM hugo.exe` 清干净后重启解决。
3. 附带一个自摆乌龙：用 `grep -c 'class="estimator"'` 检查产物恒为 0 ——
   **minify 后属性没有引号**，实际是 `class=estimator`。检查压缩产物不能带引号匹配。

### 2026-09-03 · 阶段 5（首页 + 关于页完成）

**首页**（`layouts/index.html` 重写）：首屏 → 定义句 → 最近交付 6 单 → 等级速览 → 结尾双卡。
- 首屏按 PLAN §2-E 限在 `.wrap` 内。**这是全站唯一允许裁切的大图位** ——
  它要的是氛围不是构图完整性；详情页主图才保留自然比例。
- 定义句区块 `padding-block: 86px`，全站最大的一处留白，未压缩
- 新建 `data/schedule.yaml`（档期占位 P6），文案不写死在模板里
- 结尾双卡并置「多少钱」与「什么时候能排上」（规格 C5）

**顺手清理菜单**：`hugo.toml` 里「流程 / Process」项删除（内容已并入 `/services/`，
旧 URL 走 alias），「报价」改名「服务与计价」。菜单现在是 首页 · 作品 · 服务与计价 · 关于。

**修一个响应式缺口**：769–1100px 这段窄桌面宽度上导航项会折行（实测导航高度撑到两行）。
加了收紧间距 + `white-space:nowrap` + 隐藏 `CHENGDU · EST. 2024` 副标，现在单行 45px。

**关于页**（`layouts/_default/about.html` 重写）：实景大图 + 叠标题 → 自述 → 实景图网格
→ 设备与工艺 → 资历条 → 档期与联系。
- **10 张实景照终于用上了**（`content/about/_WER*.jpg`，此前一直躺在仓库里没进构建）
- 这些是 **10–13MB 的原始相机 JPEG**，直接输出会毁掉整页。走 Hugo page bundle
  `.Process "resize 1600x webp q80"` 构建期处理，**实测产出 96–192KB**，约 100× 压缩。
  双语共用同一批处理结果（Hugo 自动去重）。
- 关于页去掉 `noindex` + 恢复进 sitemap —— 它是信任页，规格 §16 说海外访客全在这页做决策，
  之前被当成旧页一起 noindex 了。

**新增占位 P22–P24**：关于页自述三段、设备明细、FAQ 后三条的答案都是我拟的稿，
不是用户本人的话。这类内容宁可标出来也不能装作已完成。

### 2026-09-03 · 阶段 6（移动端 + 旧架构清理）

**清掉全部旧页面与旧模板**（对应用户要求的「不留新旧并存」）：
- 删 `content/rates/` `content/process/` —— 内容并入 `/services/`。
  **发现一个撞车**：`content/rates/index.md` 还带着 `layout: "services"`，
  会用新模板再渲染一份 `/rates/`，同时把 `/services/` 声明的 alias 顶掉 ——
  真实页面优先于 alias，等于制造了重复内容。删掉真实页面后 alias 才生效。
- 删 `content/contact/`（→ alias 到 `/services/`，那里有询价 CTA）
- 删 `content/painter/`（→ alias 到 `/about/`；4.0 的关于页就是它的替代，
  且它是 2026-07 审计里「NMM 自相矛盾」那条 P0 的载体）
- 删 `content/posts/` —— 里面只有一个 `_index.zh-CN.md`，**语言码写错了**
  （站点用 `zh`，文件写 `zh-CN`），Hugo 把 "zh-CN" 当成文件名的一部分，
  生成了一个垃圾 URL `/posts/_index.zh-cn/` 并一直在发布
- 删 `layouts/_default/{pricing,process,contact}.html`、`layouts/painter/`
- 删 bullgryns 目录里的 `tmp_grid.txt` `tmp_head.txt` 残留

站点结构收敛为：首页 · 作品 · 服务与计价 · 关于。实测 6 条重定向全部生效。

**移动端实测（375×812）**：无横向溢出（`scrollWidth` 375 = 视口）、顶栏 56px、
汉堡显示、导航项隐藏、作品网格 2 列 161.5px、chips 横向滚动。

**抓到一个严重缺口**：**汉堡按钮没接 JS，移动端导航完全不可用** ——
导航项在 ≤768 被 CSS 隐藏，而按钮点了没反应，等于手机上根本没有导航。
新增 `assets/js/nav.js`：抽屉开合 + aria-expanded + 点链接自动收起 + Esc 关闭。
实测抽屉含 4 个导航项 + EN/ZH（语言切换按规格 §17 收进抽屉，桌面端才在顶栏）。

**可点区域**：首轮实测 6 个元素低于 44px（logo 28、询价 42、视图切换 39、页脚链接 21）。
补 CSS 后**实测 0 个低于 44px**。微信内置浏览器没有 hover 兜底，点不中就是点不中。

**一个测不出来的东西，如实记录**：移动端滚过 400px 吸顶那段用 rAF 节流，
而浏览器面板的标签页 `document.hidden === true` —— **隐藏标签页里 rAF 根本不触发**，
所以 `is-stuck` 类在自动化测试里永远加不上。
手动加类验证过 CSS 本身正确（`position:sticky`、`top:0`、`z-index:500`、顶栏压到 48px）。
逻辑无需改动（没人看的标签页不吸顶也无所谓），但这条限制值得记 ——
以后凡是 rAF 驱动的效果，都不能指望在这个环境里自动验证。

### 2026-09-03 · 技术债清理

**P17 / P19 已解决**：
- 确认 `main.css` 零引用后删除（`grep -rn "main.css" layouts/ assets/` 为空）
- `npm uninstall tailwindcss @tailwindcss/postcss` —— 装了但从未编译过的僵尸依赖。
  保留 `autoprefixer` / `postcss` / `postcss-cli`（Hugo 的 `css.PostCSS` 要用）与 `sharp`（图片脚本要用）。
  依赖表现在只剩 4 个包。
- 顺带注意到 `backup/` 有 **2.1GB**，已 gitignore 且未被跟踪。**没动它** ——
  那是用户的备份，删 2.1GB 不该我替他决定。

**P15 字体子集化：写了脚本，但这条路走不通。如实记录。**

实测三步，每步都推翻了上一步的假设：
1. Google Fonts 的 `text=` 参数**确实有效**，返回的 @font-face 带着精确到所请求字符的
   `unicode-range`，指向 `fonts.gstatic.com/l/font?kit=…`。
2. 但 URL 有长度上限。989 个汉字 encode 后接近 9KB，**会被静默截断** ——
   表现是「成功拿到字体，只有 2.7KB」。**看着像成功，实际大部分字没进去**，
   这种失败最危险。分成每块 200 字可以绕开。
3. 真正的死路：`/l/font?kit=…` 的 token **一次性且短时**。连发 80 次请求时，
   前面若干块拿到子集，后面 token 失效后同一 URL **回吐完整字体（每片 4.5MB）**，
   最终写出 **100MB 的假子集**；再过一会儿同一 URL 又返回 0 字节。
   它不是可编程的稳定接口。

已给脚本加体积闸门（>500KB 或 0 字节一律抛错），确保这种「悄悄写出垃圾」不会再发生。
垃圾产物已清除。可行路径写在脚本末尾，两条都要先装工具并决定 30MB 源字体放哪 ——
**这需要用户拍板，不该我擅自往仓库里塞 30MB 或往他机器上装包。**

顺带一个有价值的实测数字：Google 把 Noto Serif SC / Sans SC 各切成 **202 个 unicode-range 分片**，
字体文件本身不大 —— 但**那份 @font-face CSS 本身就 454KB**。
所以自托管的收益不只是字体体积，更是干掉这 454KB 加上国内访问的可靠性。

### 2026-09-03 · 文档与残留收尾

- **404 页重写**。原版是纯 Tailwind 类，而 Tailwind 从未编译过 —— 它一直是一个**完全没有样式的页面**。
  4.0 版不做道歉，直接把人送回作品档案（唯一真正想让他看的东西）。
- **`CLAUDE.md` 重写为 4.0 事实**。这是每次会话都全量加载的固定上下文，
  写着 3.0 的事实会让后续会话照着错的做。新增了这次栽过的坑：未来日期、BOM、
  `range` 里的 `$`、minify 无引号、残留 hugo 进程、`[hidden]` 优先级、灯箱元素无 id/class。
- **`AGENTS.md` 改为指针**。它原本是 `CLAUDE.md` 的副本，已经停留在 3.0 的事实上 ——
  同一套约定有两个版本必然漂移。同样是「不留新旧并存」。
- pre-commit hook 实测通过（审计 + URL 空格检查）。
- **`backup/` 2.1GB 没动** —— 已 gitignore 且未被跟踪，那是用户的备份，
  删 2.1GB 不该我替他决定。

至此不依赖用户输入的工作全部完成。剩余全部卡在三处：定价三个数字、字体方案是否装工具、
微信号与档期等素材。

### 2026-09-03 · 收尾审计（发现一个真 bug）

**抓到 4.0 最后一处「三套矛盾价格」残留 —— 而且长在转化意图最高的地方。**

全站扫描英文站的 `EIU` / `¥` 泄漏（规格 §12 要求英文站不出现价格），
结果**每个页面恒定 2 处，共 146 处**。恒定值说明来自共用 partial ——
定位到询价浮层的等级下拉里还挂着 3.0 的价格：

```html
<option value="tabletop">Tabletop · ¥120+</option>
<option value="display">Display · ¥600+</option>
```

这有两重问题：① 违反规格 §12；② **与整个 4.0 计价模型直接矛盾** ——
站上说「只有 1 EIU = ¥40，其余全是倍数」，而客户点开询价看到的是「¥120起 / ¥600起」。
这正是 2026-07 审计列为 P0 的「三套矛盾价格」，我在页面上清干净了，**却漏了浮层里面这一处**。

已改为从 `data/pricing.yaml` 读取 4.0 的五个等级，不出现任何金额。
复扫：英文站泄漏 **146 → 0**；中文站 `¥` 只剩首页 1 处 + 服务页 1 处，全站唯一金额的规则成立。

**顺带清掉 3.0 的死代码，用实证方式确认安全：**
- `layouts/_default/list.html` 与 `single.html` —— 特征 class（`archive-masthead` `dossier-hero`）
  在产物里 0 次出现。删除后重建，**158 个页面逐字节 md5 一致**，确认是死代码。
- i18n 孤儿 key：删掉的 3.0 模板留下 163 个无人引用的 key（含 `¥120` `¥600` 那套旧价格串）。
  双语合计删除 379 行，重建后**产物仍逐字节一致**。i18n 从 388 key 降到 zh 195 / en 182。

**扫描方法本身踩了两次坑，记下来：**
1. 直接字面搜 key 会漏掉 `{{ T (printf "tier_%s_desc" .key) }}` 这类动态拼接 —— 误报 230 个孤儿。
2. 把所有 `printf` 都当成 i18n 模式又太宽：`%02d`（图片路径用的）编译成 `^[A-Za-z0-9_]+$`
   会匹配全部 key —— 变成 0 个孤儿。**只能匹配 `T (printf "…"` 这一种构造。**
   两次都是「结果看起来很干净」，实际一次全错一次全漏。

**双语 key 数不等是有意的**：zh 195 / en 182，差的 14 个全是估算器与 EIU 相关，
按规格 §12 就该在英文站缺席。已在 `i18n/en.toml` 末尾写明，免得以后被人「补齐」。

### 2026-09-03 · SEO / 无障碍 / 体积审计

**155 个页面全部通过**：每页恰好 1 个 `h1`、有 description、canonical、hreflang、
og:image、`<html lang>`，所有 `<img>` 都有非空 alt。118 个 JSON-LD 块全部可解析。

**补了两处结构化数据**：`/services/` → `Service` + `OfferCatalog`（五个等级），
`/about/` → `AboutPage` + `ProfessionalService`。
**两处都刻意不放任何数字** —— 等级系数与资历数字目前都是占位值（P1/P2/P9），
把占位值写进结构化数据等于让搜索引擎当成事实；而 `1 EIU = ¥40` 更不能进，
那是规格 §19 故意留白的商业策略。

补的时候引入又修掉一个真 bug：用 `.File.ContentBaseName` 判断页面，
**分类页没有后备内容文件，`.File` 为 nil → 空指针崩溃**，
`/tier/*` `/system/*` 全部渲染失败。改用 `.Layout`（来自 front matter，不碰 `.File`）。

**产物体积 157MB → 49MB**。根因：关于页那 10 张 10–14MB 的原始相机 JPEG
是 page bundle 资源，**Hugo 默认会把 bundle 里的全部资源原样发布**，
哪怕页面引用的只是构建期生成的 WebP。加 `_build.publishResources: false` 后
`public/about` 从 **109MB 降到 556KB**。

**扫描方法第三次踩同一个坑**：用 `property=og:image` 查产物得到「146 页缺 og:image」，
用 `alt=""` 查得到「146 页空 alt」—— 两个都是假警报。
minify 的引号是**有条件保留**的：普通值去引号，值里含 `:` `/` 的保留。
已把这条更正写进 `CLAUDE.md`（原来那条写的是「minify 后属性没有引号」，不准确，正是它误导了我）。

**登记 P25**：`static/stock/`（12MB）与 `static/img/studio/`（13MB）零引用，
但每次部署都会上传。**没有删** —— 那是用户的图片资产，删哪些是他的决定；
都在 git 里，随时可恢复。

### 2026-09-03 · 无 JS 降级审计（两个真 bug）

**Bug 1：图集在无 JS 时是死的。** 规格 §8 要求「灯箱退化为 `<a href="原图">`」，
但我把 plate 写成了 `<div>` —— 关掉 JS 点击毫无反应，那一整页的图就看不了大图。
改成 `<a class="plate lightbox-trigger" href="{{ $src }}">`，
同时给 `lightbox.js` 的点击处理加 `e.preventDefault()`（否则有 JS 时会跳走而不是开灯箱）。
实测两条路径都对：有 JS 点击开灯箱、`location.href` 不变；无 JS 时 href 直连原图。

**Bug 2：文章类页面整篇正文消失。** `work/single.html` 只在 `photos > 0` 时渲染图集，
**我漏写了 `{{ else }}` 分支渲染 `.Content`**。
`warhammer-painting-beginner-guide` 的 md 里有 75 行正文，渲染出来**只有 254 个可见字符**（全是页面骨架）。
CLAUDE.md 那条「正文完全不渲染」只对**有图集的委托单**成立，对文章成立就等于整页空白。
补上 else 分支 + `.article-body` 排版样式后，可见文字 254 → 471(zh) / 1160(en)。

**顺带**：这页原来不可达的 `{{< lightbox >}}` 短代码现在真的会渲染了，
所以把它从 3.0（Tailwind `rounded-lg shadow-lg`）重写为 4.0，并同样加上 `<a href>` 降级。
`tech_row.html` 与 `wip.html` 全站零引用，删除。

**其余降级检查通过**：作品页构建期直出全部 56 张卡片（网格 + 列表各 56 个 `<a>`），
「加载更多」按钮默认 `hidden` 由 JS 启用 —— 无 JS 时看到的是完整列表而不是只有 12 条。
`/tier/*` `/system/*` 静态分类页作为筛选的兜底存在。
`target="_blank"` 只出现在外部 Instagram 链接上，站内导航无新窗口（规格 §17）。

**新增 P26**：指南页正文仍是 3.0 的 Tailwind 卡片标记。Tailwind 未编译，
所以它渲染成纯文本堆叠 —— 可读但没有原本设计的卡片样式，需要改写成普通 Markdown。

### 2026-09-03 · 键盘可达性审计

**上一轮把 plate 从 `<div>` 改成 `<a>` 时顺带修好了一件事**：div 本来就不可聚焦，
键盘用户根本打不开灯箱。现在 Tab 能走到图，回车即开。

**补了灯箱的焦点管理**（原本完全没有）：
- `role="dialog"` + `aria-modal="true"` + 每个按钮的 `aria-label`
- 打开时焦点移入对话框（落在关闭按钮），**关闭时还回触发它的那张图** ——
  否则键盘用户会被丢回页面顶部
- **焦点陷阱**：对话框开着时 Tab / Shift+Tab 只在内部循环，不会跑到蒙层背后看不见的元素上

实测全通过：焦点进入、Tab 首尾环绕双向、Esc 关闭并归位。

**焦点陷阱的可见性判断换了两次，两次都是实测推翻的：**
1. `offsetParent !== null` —— 灯箱是 `position:fixed`，**内部所有元素的 offsetParent 都是 null**
   （实测 6/6）。用它过滤得到空数组，陷阱静默失效。
2. `getBoundingClientRect().width > 0` —— 自动化浏览器面板的标签页 `document.hidden` 为真时
   **浏览器不计算布局，所有 rect 归零**（实测连灯箱自身的宽度都是 0）。
3. 最终用 `getComputedStyle(b).display !== 'none'` —— 不依赖布局，任何情况下都返回真实值。

**测试本身也踩了一个坑**：询价浮层同样是 `role="dialog"` 且在 DOM 里更靠前，
`querySelector('[role=dialog]')` 拿到的是它不是灯箱，导致断言全错。
改用 `aria-label="Image viewer"` 精确定位才拿到正确结果。

**其余检查通过**：`functions/api/commission.js` 端点完好，`npm run build` 端到端成功，
作品页 162 个可聚焦元素、`aria-pressed`/`aria-current`/`aria-expanded` 齐备。

### 2026-09-03 · 浮层与估算器的键盘可达性

**询价浮层原本有 `role="dialog"` 却没有任何焦点管理** —— 打开后焦点仍留在浮层背后，
键盘用户等于打不开它。补上：打开时焦点移入（落在关闭按钮）、Tab 首尾环绕的焦点陷阱、
关闭时焦点还给触发它的按钮。实测三项全通过。

**估算器的 `role="radiogroup"` 是个空头支票** —— 模板标了角色，
`estimator.js` 却完全没处理方向键。读屏会告诉用户「单选按钮 2/4」，
用户按方向键却没反应 —— **只标角色不实现行为，比不标更糟**。
补上方向键切换（左右上下环绕）、Home/End、以及 roving tabindex（整组只有选中项进 Tab 序列）。
实测：初始 Specialist → EIU 18，方向键右移到 Spec Ops → 30，Home 跳回 Battleline → 10，
数字与 `data/pricing.yaml` 的系数逐一吻合。

**顺带补上规格 §4.9 漏做的「复制微信号」按钮。** 是数焦点元素时发现的 ——
QR 态只有 2 个可聚焦项（关闭 + 转表单），少了复制按钮。
新建 `data/contact.yaml`：`wechat_id` 留空时**整块不渲染**，不显示假号码；
填上真实号码即自动出现，不必改模板。复制逻辑保留 `execCommand` 兜底 ——
微信内置浏览器里 `navigator.clipboard` 常不可用，而那正是主要使用场景。
渠道链接（P10）同样收进这个文件，留空的不渲染。

### 2026-09-03 · 结构化数据修复 + 死代码清理

**发现 3.0 就存在的 JSON-LD bug：所有值都被双重转义。**
`"url":"\"https://viiyd.com/\""` —— 能 `JSON.parse`，但每个值都带着字面引号，
Google 读到的 URL 是 `"https://viiyd.com/"` 而不是 URL，整套结构化数据都是废的。
根因：在 `<script type="application/ld+json">` 里逐字段写 `{{ . | jsonify }}`，
Go 模板把它当 JS 字符串又转义了一次。
改成 Hugo 推荐的写法：先用 `dict` 组装整个对象，再 `{{ $ld | jsonify | safeJS }}`。
四种 schema（ProfessionalService / VisualArtwork / Service / AboutPage）一次性修好，
实测 url 已是干净字符串。

**我此前那句「118 个 JSON-LD 块全部有效」是站不住的** —— 只验了「能解析」，没验值。
能解析的坏数据比解析失败更难发现。

**删掉 `reveal.js`**：它绑定 `.hero-figure` / `.reveal`，4.0 里这两个类都不存在，
`head.html` 里那段配套的 `js-reveal` 兜底脚本也一并清掉（删完后它是个空 setTimeout）。
用 12 行 IntersectionObserver 在 `nav.js` 里实现 handoff §7 要求的 `.fade-in`
（只做 opacity，不做位移；无 IO 或 `prefers-reduced-motion` 时直接全部显示）。

**联系方式全部收进 `data/contact.yaml`**：5 处硬编码的 Instagram 链接、
页脚渠道、JSON-LD 的 `sameAs` 现在都读同一处，留空的渠道不渲染。

**第四次被自己的 grep 误导**：`grep -E` 的 `.` 默认不匹配换行，
用 `site-foot__links.{0,400}` 查多行 HTML 会在换行处截断，看起来像「Instagram 没渲染」，
实际渲染得好好的。已把这条连同 minify 引号那条一起写进 `CLAUDE.md`：
**查跨行结构用 Node/Python 读文件，不要用 grep。**

### 2026-09-03 · 链接与资源值审计

沿着「格式对但值是坏的」这条线继续扫，又抓到一处：

**2 个页面的 `og:image` 是相对路径**（`/images/warhammer-painting-example.jpeg`）。
社交平台（含微信）解析不了相对 URL —— 那页分享出去**没有预览图**。
`head.html` 里 `$ogImage` 现在统一过 `absURL`，复扫相对 og:image / twitter:image 均为 0。

**其余全部通过（这次是真验了值，不只是格式）：**
- 155 页的 `canonical` 与页面自身 URL 逐一比对，0 处不匹配
- 每页的 hreflang 集合都包含自身 URL，0 处缺失
- **157 个 HTML 里的全部站内链接扫了一遍，死链 0 种** —— 包括 alias 重定向后的旧路径
- 3098 个去重后的 R2 图片 URL：含空格 0、双斜杠 0、无扩展名 0
- **4146 个 `<img src>` 里指向原图的有 0 个** —— 三级加载契约在全站成立，
  不只是此前抽查的那一页。分布：cdn-cgi 缩放 2614 / `_web` 预生成 1532 / 原图 0
- 抽样 8 个 `_web` 文件实际请求 R2，全部 200，体积 42–278KB，落在预期区间

### 2026-09-03 · CSS 瘦身 · 构建可重现性 · 估算器边界

**未用 CSS 清理**：153 个类里有 4 个全站从未出现（`section--tall` `display-latin`
`photo--cover` `sr-only`），删掉。现在 149 个类、**0 未使用**。
（删的时候留了个尾巴：媒体查询里 `.section--tall > .wrap,` 是分组选择器，
正则只删了独立规则，得再补一刀。）

**构建可重现性**：连续两次干净构建（`rm -rf public && hugo --gc --minify`），
255 个文件**逐字节 md5 全部一致** —— 没有时间戳之类的东西漏进产物，
fingerprint 稳定，CF Pages 每次部署的差异就只来自真实改动。

**估算器边界测试，抓到一个可信度问题**：输入框有 `min="1"`，
但**手输和粘贴绕得过去** —— 实测输 `-5` 算出「**-9 EIU**」，输 `99999` 算出六位数。
客户在报价工具里看到负数，比看到没有工具更糟。
已在 `estimator.js` 里把数量夹到 `[0, 9999]`、结果取 `Math.max(0, …)`，
并给输入框补 `max` 与 `inputmode="numeric"`（移动端弹数字键盘）。
复测：-5 → 0、99999 → 夹到 9999 只、abc → 0、正常值 → 18。

**多行相加验算正确**：10 步兵 + 4 载具（×6）在 Specialist(1.8) 下
= 18 + 43.2 = 61.2 → 向上取整 62，与页面显示一致。

### 2026-09-03 · 筛选容错 + 一个会导致「假失败」的本地陷阱

**先记一个坑，它差点让我误判代码有 bug**：测 URL 参数容错时，页面表现得像筛选完全没生效
（56 条全显示、状态行不动）。控制台里是
`Refused to execute script ... MIME type ('text/plain') is not executable` ——
陈旧的 hugo server 进程把 `/js/*.js` 发成了 `text/plain`，**Chrome 拒绝执行全部 JS**。
根因是本机注册表 `HKCR\.js` 没有 `Content Type` 键（`.css` 有，所以样式正常，
更容易让人以为「只是 JS 逻辑错了」）。重启 server 后 MIME 恢复 `text/javascript`。
**生产构建不受影响**（产物是 fingerprint 过的 `.min.js`，CF Pages 发正确 MIME）。
已写进 `CLAUDE.md`：浏览器里像是 JS 没跑时，先 curl 查 MIME 再怀疑代码。

**筛选参数容错**：`?system=<script>&tier=NotATier` 这类乱改，原先会被原样套用 ——
结果是 0 条、空状态出口、状态行把 `<script>` 原样回显（安全，因为走的是 `textContent`，
实测无注入，但难看，而且用户看到的是一个永远筛不出东西的死页面）。
改成**只认真实存在的 chip 值**（用 `CSS.escape` 查 DOM），认不出就当没写。
复测：垃圾参数 → 12 条正常首批、状态行「全部游戏 × 全部等级」；
合法参数 `?tier=Master` → 仍然 11 条，未误伤。

### 2026-09-03 · 边界与交互审计

**灯箱首尾环绕**：37 张图，第 1 张按 ← 到 37/37，再按 → 回 1/37。循环正确。

**视图切换 × 筛选的交互**：`?tier=Legend` → 网格 4 条；切到列表仍 4 条、URL 不变；
切回网格仍 4 条；清除筛选后**视图偏好保留在列表**、回到首批 12 条、`localStorage` 记住 `list`。
两个状态互不干扰。

**706 个 `_web` 文件全量核验：703 直接通过，3 个报网络异常**。
没有据此判定缺失 —— 逐个重试后**全部 200**（223KB / 163KB / 79KB），
那 3 个是 24 并发下的超时假警报。**706/706 全部存在**，
意味着 plate 的 `onerror` 兜底链（`_web` 失败 → 退原图 → 再失败则整块隐藏）
是不该被触发的安全网，不是日常路径。

**兜底链本身没测成**：模拟 `_web` 缺失时 `onerror` 没有触发 ——
不是逻辑错，而是隐藏标签页不加载图片（与 rAF 同类的环境限制）。
R2 对不存在的路径确实返回 404（27KB HTML 错误页），
所以真实浏览器里 `onerror` 会正常触发。**这条只能真机确认。**

### 2026-09-03 · 性能实测（真实字节，不是估算）

**列表页首批 12 张缩略图：369.3KB**，规格 §9 目标 <1.2MB —— 通过，且余量很大。
单张 17–50KB、平均 30.8KB，正落在规格预期的 8–50KB 区间，说明 cdn-cgi 的 640w 缩放链路是有效的。

**站点自身资源（gzip 后）：**

| 资源 | 原始 | gzip |
|---|---|---|
| CSS（tokens+base+components 合并） | 23.4KB | **5.0KB** |
| JS（6 个文件） | 19.4KB | **7.0KB** |
| 作品档案页 HTML | 95.7KB | 17.0KB |
| 首页 HTML | 34.9KB | 10.7KB |
| 委托详情页 HTML | 62.1KB | 11.9KB |
| 服务与计价页 HTML | 36.1KB | 11.1KB |

**给 P15 一个准确的代价数字。** Google Fonts 那份 @font-face CSS：
未压缩 454,870 字节，**gzip 后实际传输约 124KB**。
（第一次只测了未压缩值就想写「444KB」——那会高估近 4 倍。加 `--compressed` 重测才是真实传输量。）

124KB 意味着：**光是描述字体的那份 CSS，就等于站点自身 CSS+JS+HTML 全部加起来（约 30KB gzip）的 4 倍**，
也相当于首批 12 张作品缩略图的三分之一。再加上国内访问 fonts.googleapis.com 的可靠性问题，
自托管子集的收益是清楚的 —— 但仍卡在「要装工具 + 30MB 源字体放哪」这个需要用户拍板的地方。

### 2026-09-03 · 首屏带宽 + 部署缓存

**详情页首屏浪费了 336KB。** hero 是 `fetchpriority=high` 的 114KB `_web` 图，这没问题；
但图集的前 4 张 plate 被我写成了 `loading="eager"` —— **它们全在折叠线以下**，
首屏根本看不到，却要抢 336.6KB 带宽。
改成全部 `lazy` + `decoding="async"`。plate 01 与 hero 是同一个 `_web` URL，
命中缓存不额外请求，所以没有任何视觉损失。
**详情页首屏图片重量：451KB → 114KB。**

**各页加载优先级复核**（实测产出）：
- 首页：1 张 `fetchpriority=high`（79KB）+ 6 张 lazy
- 作品档案：0 eager / 112 lazy（网格没有单一 LCP 主体，正确）
- 关于：1 张 high + 3 张 lazy
- 服务与计价：无图

**新增 `static/_headers`**（此前没有，CF Pages 一直用默认缓存策略）：
Hugo 对 CSS/JS 做了内容指纹，改动必然带来新文件名，所以给一年期 `immutable` 是安全的；
关于页那批构建期生成的 WebP 同理。HTML 则设 `max-age=0, must-revalidate`，
交给 CDN 边缘缓存 + 每次部署刷新。

### 2026-09-03 · robots / 字体回退 / 安全头

**站点此前一直没有 `robots.txt`。** `layouts/robots.txt` 模板早就在，
但 `enableRobotsTXT` 没开，Hugo 就不渲染它 —— 也就没有向搜索引擎显式声明 sitemap。

开这个开关时又栽了一次 **TOML 作用域**：我把 `enableRobotsTXT = true` 放在
`[languages.zh]` 等表之后，**TOML 里表头之后的裸键属于那个表**，
于是它变成了语言的子键，配置写了等于没写，还不报错。
移到第一个 `[表头]` 之前才生效。这和之前 taxonomy 单复数那次是同一类：
**配置项静默失效，构建照样成功。**

**字体回退栈补了中日韩字体**。原来只写 `'Noto Serif SC', serif` ——
`font-display: swap` 期间用户先看到的就是回退字体，
而各平台默认 `serif` 未必是中文衬线（Windows 上常退成不合适的字形）。
现在点名 Source Han Serif SC / Songti SC / SimSun 与 PingFang SC / Microsoft YaHei。

**安全响应头**加了三条无副作用的（`X-Content-Type-Options`、`Referrer-Policy`、
`X-Frame-Options`）。**故意不加 CSP** —— 站点要加载 Turnstile、CF Analytics、
Google Fonts、R2 图片四个外域，CSP 写错会直接打断询价链路，
对一个静态展示站来说收益不足以抵消这个风险。

顺带把根配置里的 `title = 'VIIYD 3.0'` 改掉（实际标题走分语言配置，但留着是脏的）。

### 2026-09-03 · 配置逐条核对（又两条静默失效）

用 `hugo config --format json` 把 `hugo.toml` 的实际生效值逐条对了一遍，发现：

**`defaultContentLanguage` 与 `defaultContentLanguageInSubdir` 写在 `[params]` 之后**，
于是变成了 params 的子键 —— `hugo config` 里赫然是 `params.defaultcontentlanguage`。
**这两条从来没有作为配置生效过。** 站点表现正确纯属巧合：
Hugo 的默认值恰好就是 `en` / `false`。
哪天想改成中文优先，改那两行会毫无反应 —— 这比配置写错更难查。
移到第一个 `[表头]` 之前后，`params` 里干净了（只剩 4 个真正的自定义参数）。

**这是同一类坑的第三次**（前两次：`enableRobotsTXT` 同样掉进语言表、
taxonomy 写成复数名导致分类页全空）。共同点是**三次都不报错、构建照样成功**。
已写进 `CLAUDE.md`：改完配置要用 `hugo config --format json` 核对生效值，不能只看构建是否通过。

**顺带确认了产物污染问题**：核对时发现 `/en/index.html`（语言别名重定向）里写的是
`http://localhost:1313/` —— 因为 `hugo server` 还开着，它会往 `public/` 回写。
停服后干净重建：别名指向 `https://viiyd.com/`，全站 `localhost` 残留 0，155 页。
也写进了 `CLAUDE.md`：**验收生产产物前必须先停 dev server**。

### 2026-09-03 · 把踩过的坑写进质量门禁

阶段 0 计划里说要给 `audit_content.js` 加 4.0 的校验，一直没做。现在补上，
并且**把这次真正栽过的坑全部变成门禁规则** —— 它们的共同点是「不报错、构建照样成功」：

| 规则 | 挡住什么 | 来源 |
|---|---|---|
| `InvalidSystem` | system 不在六个枚举内 | 4.0 新字段 |
| `BOM` | 文件带 UTF-8 BOM | 迁移脚本被 27 个文件绊住 |
| `FutureDate` | date 落在未来 → Hugo 静默跳过该页 | 服务页整页不生成，查了半天 |
| `BilingualMismatch` | `system`/`delivered` 双语不一致 | 会让同一委托单落进不同分类页 |

**验证规则本身有没有效**（这一步不能省，否则就是又一条「写了等于没写」）：
造了一个故意坏掉的测试页，四条规则全部触发、退出码 1；删掉后回到 0。

**过程中在自己的新代码里抓到同一类 bug 两次：**
1. 双语检查最初插在**报告输出之后**，而且嵌在 `if (issues.length)` 里 ——
   没有其它问题时它根本不执行。移到报告前才生效。
2. 新规则一开始**不阻断提交** —— 退出码逻辑只认 `MissingPhotos`/`InvalidTier`，
   双语不一致照样能提交。改成 `BLOCKING` 白名单（`Placeholder` 仍只提醒不阻断）。

两次都是「测试一下就露馅，不测就永远发现不了」。
另外 Python 的 `str.replace` 匹配失败是**静默**的，这轮因此空改了一次 —— 加 `assert` 才发现。

### 2026-09-03 · 发布链路的文档与脚本对齐

**发现一个会让每个新作品都出错的缺口**：`DOCS/WORK_TEMPLATE.md` 与
`.agent/workflows/publishing.md` 都还是 3.0 的字段清单，**没有 `system` / `delivered`**。
新增门禁只挡非法值，挡不住「照着旧模板填、根本没写这两个字段」——
结果是新作品**不会出现在任何分类页里**，而且不报错。
两份文档都补上了，并写清后果：
- `system` 漏写 = 这一单不进 `/system/*` 分类页
- `delivered` 双语必须一致（审计会比对）
- `date` 必须带时区，否则 Hugo 静默不生成该页
- `eiu` 在定价拍板前可留空，留空即不显示

模板版本号也从 v3.0 改成 v4.0。

**6 个脚本已无人引用**（`migrate_work.js`、`localize_work_cn.js`、`fix_dates.js`、
`fix_url_spaces.js`、`lint_urls.js`、`optimize_static.js`）。
**没有删** —— 是用户的工具，删哪些该他决定。
但加了醒目的 `⚠️ DEPRECATED` 头，逐个写明为什么停用。
其中 `migrate_work.js` 尤其危险：它不认识 `system`/`delivered`/`eiu`，
**在 4.0 内容上跑会破坏 front matter**。登记为 P27。

### 2026-09-03 · 文档层的「旧真相」清理

代码改完了，但 `DOCS/` 里几份文档还在**声称自己是当前标准**，这比代码残留更危险 ——
后续会话（或用户自己）照着做，会一路做回 3.0。

**最危险的一份**：`DOCS/DESIGN_SYSTEM.md` 开头写着
`Status: Current source of truth`，引用的却是**已删除的** `assets/css/main.css`
和 `layouts/painter/list.html`。已改成醒目的退役横幅，并指明 4.0 的三个真实来源
（`tokens.css` / `CLAUDE.md` 的前端约定 / 本文件）。

**`DOCS/README.md` 索引本身就是错的**：它列着 `BUSINESS_PLAN.md` 与 `ROADMAP.md`，
**这两个文件并不存在**。重写为「当前有效 / 已退役」两张表，只列真实存在的文件，
并写明架构红线在仓库根的 `CLAUDE.md` 而不在 DOCS 里。

**`DOCS/STANDARDS.md`** 把 `DESIGN_SYSTEM.md` 当作前端唯一来源、
让人用 `main.css` 里的 `--page-pad` —— 两处都已更正到 4.0 的 `tokens.css`。

**加时点注记**：`ARCHITECTURE.md`、`SYSTEM_HANDOFF_PROTOCOL.md`、
`FRONTEND_IMPROVEMENT_FRAMEWORK.md`、`CONTENT_INVENTORY.md` 四份都写于 4.0 之前，
各自加了一行说明变化在哪、以什么为准。**没有删** —— 它们记录了 3.0 为什么那样做，
是有价值的历史，只是不能再被当成现状。

复扫确认：指向已删文件的引用只剩在带退役横幅的文档里。

### 2026-09-03 · 文案自审（129 条 4.0 词条）

把 4.0 新写的 129 条双语文案逐条列出来对了一遍。两处真不一致，已修：

1. **孤儿 key `[tier]`**（EN `Quality Tier` / ZH `质量等级`）—— 3.0 遗留，
   模板里没有任何 `T "tier"` 引用，产物里也搜不到这两个词。
   而 4.0 用的是 `spec_tier`（`Tier` / `涂装等级`）——**两套术语并存**，
   将来谁改文案都可能改错地方。已删。
   （删的时候注意到它在文件第 1 行，正则要求前导换行所以第一次没匹配上 ——
   文件开头的块要用 `^` + MULTILINE。）
2. **`filter_all` 英文写成全大写 `ALL`**，而同屏的其它 chip 是
   `Warhammer 40K` / `The Old World` 这样的 Title Case，状态行是 `All systems` / `All tiers`。
   改成 `All`，与周围一致。

**几处「看着不一致、实际是有意的」，确认后没动：**
- `faq_1` 中英完全不是同一个问题（ZH「EIU 怎么算」/ EN「接不接海外委托」）——
  规格 §12 明确英文站不翻寄件细节，只留国际委托那条。这是设计意图。
- `size_*_eg` 的举例中英不同（ZH「司天丞 / 骑将」/ EN「Mounted characters」）——
  中文受众认得中国龙那套单位名，英文受众不认得，用泛称更好懂。

### 2026-09-03 · 3.0 遗留文案里的两处冲突（都在询价链路上）

把 56 条 3.0 遗留中文词条筛了一遍，找与 4.0 术语冲突的：

**1. 术语分裂：询价表单里叫「档次」，全站其它地方叫「涂装等级」。**
最要命的是位置 —— 客户在**转化意图最高的那一刻**看到一个全站没出现过的词。
`cm_field_tier` / `cm_field_tier_zh` 都改成「涂装等级」。
复查服务页：「档次」0 处、「涂装等级」3 处，统一了。

**2. 承诺了不存在的回复渠道。** 两处提到 Discord / Telegram：
- `cm_body`：「我会通过您选择的渠道回复——微信、邮件、**Discord 或 Telegram**」
- `cm_contact_placeholder`：「微信 / 邮箱 / **Discord / Telegram**」

站上从头到尾没有 Discord，Telegram 是**工作室的内部通知渠道**（表单 → D1 → Telegram），
不是客户渠道。让客户留 Discord 然后在那儿等回复，等不到就是失信。
两处都改成「微信 / 邮箱」。复查：**Discord 全站 0 页**。

**但保留了两处 Telegram 披露，这是有意的区分：**
- `cm_privacy_text`：「您的信息以 Telegram Pin 消息的形式发送到我的手机」
- 浮层底部：「Stored on Cloudflare D1 · forwarded to my private Telegram」

这两条说的是**你的数据流向哪**（诚实的隐私披露），不是**我用什么渠道回复你**（承诺）。
前者必须留，后者必须删 —— 同一个词，性质完全相反。

### 2026-09-03 · 询价入口归因全量实测

规格 §13 要求每个询价入口带来源标记，用于判断哪个位置在带客。
此前只测过 nav 与 lightbox 两个，这次把**全部 9 个入口逐一点开验证**
（点击 → 浮层是否打开 → `?from=` 是否等于该入口的标记）：

| 页面 | 入口 | 结果 |
|---|---|---|
| 首页 | nav · home-hero · home-schedule · footer | 4/4 ✓ |
| 作品档案 | nav · footer | ✓ |
| 委托详情 | nav · work · footer · **lightbox**（灯箱内单独测） | 4/4 ✓ |
| 服务与计价 | nav · legend · estimator · estimator-legend · footer | 5/5 ✓ |
| 关于 | nav · about · footer | 3/3 ✓ |

**测试写法上踩了一个值得记的坑**：第一版断言写成 `out.every(x => x.ok)`，
而页面没加载出来时 `out` 是空数组 —— **`[].every()` 恒为 `true`**，
于是得到「results: [] , allOk: true」这种**通过但什么也没测**的结果。
加了 `found === 0` 的显式判定才暴露出来。

**另外确认两处「看着该统一、实际不该统一」：**
- 询价表单的「项目类型」（单件/小队/载具/场景/**修复**/其他）与 4.0 的体型倍数
  （步兵/精英/骑乘/载具/泰坦）是**两个不同的轴**：前者问「什么活」，含修复这种非涂装项；
  后者问「每个模型多大」，用于算 EIU。强行统一会让「修复」这类单子无处可填。
- 下拉的 6 个选项分别用 `form_project_*` 与 `cm_project_*` 两种前缀 ——
  命名不统一（找 `form_project_vehicle` 会找不到），但功能与渲染都正确，中文六项齐全。
  记下来，暂不动。

### 2026-09-03 · 英文站系统实测（规格 §12 全项通过）

中文站测透了，英文站此前只做过静态 grep。这次逐页在浏览器里跑：

| 页面 | 询价入口 | 浮层态 | EIU | ¥ | 备注 |
|---|---|---|---|---|---|
| 服务与计价 | nav · legend · footer（3/3 归因 ✓） | **表单态**（QR 隐藏） | 0 | 0 | 无估算器 ✓ |
| 委托详情 | nav · footer（无 `work` 入口） | — | 0 | — | 规格块无 EIU；换成「See more on Instagram →」✓ |
| 首页 | nav · footer | — | 0 | 0 | **结尾只剩 1 张卡**（计价卡正确省略）✓ |
| 关于 | nav · footer | — | 0 | — | 自述正常渲染（404 字符）✓ |

**灯箱的英文降级是自动的**：`data-lb-cta` 在英文站为空 → JS 把询价按钮
`display:none` 并清空文案，底部只剩「Specialist · Delivered 2026.06」。
不需要为英文站写第二套灯箱逻辑。

**修了一处不诚实的标签**：英文页脚原本硬编码写着 `WECHAT`，
但英文站点开是**表单**不是二维码 —— 说的和给的不是一回事。
改为分语言取文案：中文「微信」、英文「CONTACT」。

**测试写法的教训（本轮第二次）**：先在 `/services/` 上用同一段脚本跑，
返回 `results: [] , allOk: true` —— 页面没加载完就断言，而 `[].every()` 恒为真。
加 `found === 0` 判定后才拿到真结果。**空集合上的全称断言永远为真**，
凡是「遍历并断言」的测试都要先断言集合非空。

### 2026-09-03 · hreflang 全量核验 + 404 的语言问题

**hreflang 完美**：146 个页面逐一检查 —— 全部同时有 `en` 与 `zh-CN`、
所有 hreflang 目标页都真实存在、**且全部双向互指**（A 指 B 时 B 也指回 A）。
缺双语对 0、指向不存在页 0、单向不互指 0。

**发现一个中文访客会直接撞上的问题**：
Cloudflare Pages **只用根目录的 `/404.html`** 服务全站 404。
`/zh/404.html` 虽然生成了也永远不会被使用 ——
也就是说**中文访客点到坏链接会看到英文页**，而他们是主要受众。

修法：根 404 内嵌一份中文文案，按 `location.pathname` 是否以 `/zh/` 开头切换，
同时把两个链接改指 `/zh/work/` 与 `/zh/`。无 JS 时保持英文，不白屏。
实测：`/zh/nope/` → 中文文案 + `/zh/work/` 链接 + `lang="zh"`；
`/nope/` → 英文文案 + `/work` 链接，互不干扰。

**文案挪到 `data/notfound.yaml` 而不是 i18n** —— 因为根 404 是英文站渲染的，
模板里 `T "nf_title"` 只能取当前语言的值，取不到另一种（`| default "中文"`
也没用，key 存在时 default 根本不触发）。放 data 里两种语言都读得到，单一来源无漂移。

**同一个双重转义坑第二次栽**：`var zh = {{ $zh | jsonify }}` 产出的是
`var zh = "{\"title\":…}"` —— **字符串不是对象**，`zh.title` 是 `undefined`，
表现为文案变成空白（不报错）。加 `| safeJS` 才对。
第一次是 `head.html` 的 JSON-LD。已把这条在 `CLAUDE.md` 里从「JSON-LD 专用」
泛化成「**凡是把 Go 的值注入 `<script>` 都要 `jsonify | safeJS`**」。

### 2026-09-03 · safeJS 全站扫描（结论：无遗漏，但区分很重要）

写了脚本扫 `layouts/` 下所有**内联** `<script>` 里的 Go 表达式（排除控制流与注释）。
结果 8 处，两处带 `safeJS`（JSON-LD、404 中文包，都是这次修的），
6 处不带 —— 逐个看过，**全都是正确的**：

- `head.html:84` 那条是我自己写的**注释里的示例代码**，扫描脚本的误报。
- `commission-modal.html` 的 5 处是 `btn.textContent = '{{ T "cm_submit_ready" }}'` ——
  字符串注入到**已经加了引号的 JS 字面量**里。这里 Go 的转义**正是需要的**，
  它防止文案中的引号逃逸出字符串。产物是干净的 `textContent = '发送 →'`。

**所以规则要分两种情况写，不能一刀切**（已在 `CLAUDE.md` 里改精确）：
- 注入**对象/数组** → 必须 `jsonify | safeJS`，否则字段全 `undefined`
- 注入**引号内的字符串** → **不要**加 `safeJS`，加了等于关掉 XSS 防护

原来那条写成「凡是注入 `<script>` 都要 safeJS」是危险的 ——
照着做会有人给那 5 处也加上，开出一个注入口子。

### 2026-09-03 · 无障碍审计（并行 agent）与修复

挂了一个只读审计 agent 逐项核算对比度与 ARIA。它翻出的问题里，
**最要命的一条是我自己制造的**：

**`.cm-select option { background: var(--fg); color: var(--fg); }` —— 白字白底，1:1。**
来源是我做令牌批量迁移那次：当时写了 `background:var(--fg)` → `background:var(--ink)` 的修正，
但**这一行是 `background: var(--fg)`（冒号后带空格），字符串没匹配上**。
两个下拉（项目类型、涂装等级）的选项在按作者样式渲染 option 的浏览器上不可读。
已改为 `background: var(--ink); color: var(--fg-body)`。

**其余已修：**
- **键盘无法上传参考图**（功能性阻断）：`#cm-drop` 是个只有 `onclick` 的 `div`，
  真正的 `input[type=file]` 是 `display:none` 不在 tab 序列 —— 键盘用户**完全传不了图**。
  补 `role="button"` + `tabindex="0"` + Enter/Space 处理。
- **询价表单 6 个控件全部没有可访问名**：视觉标签是 `<span>` 不是 `<label>`，只靠 placeholder。
  补上 `aria-label`（复用已有的 i18n 问句文案，如「怎么称呼您？」）。
  对照：估算器的控件本来就有 `aria-label` —— 同站两种做法，现已统一。
- **表单控件的焦点环被 `outline:none` 抹掉**：body 内的 `<style>` 在 head 的合并 CSS 之后，
  盖掉了全局 `:focus-visible`。而替代指示（底边变白）与「已填写态」完全一样，
  失焦后分不清焦点在哪。补回 `outline: 1px solid var(--primary) !important`。
- **筛选 chip 只有 class 没有 `aria-pressed`**，读屏听不出哪个筛选生效；
  状态行的结果数由 JS 改写却无 `aria-live`，变化不播报。两处都补了。
- `badge.html` / `seal.html` 的 `<svg aria-label>` 缺 `role="img"`，部分读屏会丢弃标签。已补。
- **`tokens.css` 里的对比度注释有两处不实**：`--fg-body` 写 12.9 实测 **15.44**、
  `--primary` 写 5.9 实测 **6.64**（都是实际更好）。数值来自交接包，被当成设计事实引用过，已按实测订正。
  同时补注：`--fg-muted` 对 `--ink-raised` 只有 **4.93:1**，余量仅 0.43 —— 原注释的「5.28 是下限」只在 `--ink` 上成立。

**没有擅自改的一条，登记为 P28**：`.btn-action` 白字在朱砂上 **3.34:1**，AA 不达标
（13.5px/500 是普通文本，不适用大字豁免；交接包说的「≥13px 即可」没有 WCAG 依据）。
三条出路：字色改墨色（5.67:1 达标但**改变品牌主 CTA 的观感**）、
字号加粗到 ≥18.66px bold 走 3:1 门槛、或接受不达标。
**这是品牌观感取舍，该用户拍板，不是我该单方面改的。**

### 2026-09-03 · 微信兼容性审计（并行 agent）与修复

**又一条我自己制造的生产 bug，而且是最严重的一条：**

`base.css` 里 `:lang(en) .display-1, :lang(en) .display-2,` **丢了整个声明块**，
两个悬空选择器直接串到下一条 `p, .body{ font-size:15px … }` 上。
后果：**英文站所有主标题被渲染成 15px 正文**，桌面移动都中，已经在生产 CSS 里。

来源是我删 `.display-latin` 那次 —— 正则把声明块一起吃掉了。
**而我当时的括号配平检查通过了，因为括号确实是平的**（选择器合并不破坏括号）。
这类错只能靠看产物 CSS 发现。已恢复，实测 1440px 下英文 h1 = 68px / Instrument Serif。

**高危兼容性修复（微信 X5 内核常见 Chromium 86，正好卡在多个特性的支持边界）：**

- **`inset:0` → 补写四方向**。不认 `inset` 时 top/right/bottom/left 全为 auto，
  `#cm-backdrop` 会**塌成 0 高度 —— 点「询价」什么都不出现**，全站唯一转化入口失效。
  同样处理了 `.img-scrim`（塌陷后白色大标题直接压在亮实拍上）与两个 hero 图。
- **`lightbox.js` 四处 ES2020 语法降级**（可选链 `?.` ×2、可选 catch 绑定、NodeList 扩展）。
  这些是**解析期**错误：任一不支持 → 整个文件一行都不执行 → 灯箱死掉，
  而 `.plate` 的 href 指向 **0.7–2.4MB 原图**，用户每点一张就跳走下载一次。
- **`navigator.clipboard` 加守卫 + execCommand 兜底**。微信里它常为 undefined，
  原来在 async 函数里静默抛错 —— 点「分享」毫无反应连 toast 都没有。
  照抄了 `cmCopyWechat` 已有的正确写法。
- **`CSS.escape` 加守卫**：缺失会 TypeError 打断整个 `archive.js`，
  筛选/视图切换/加载更多全部失效。
- **NodeList `.forEach` 统一成 `[].slice.call(...)`**（`estimator.js` 里本就两种写法并存）。

修完实测：筛选仍 11 条、aria-pressed 正常、视图切换正常。

**新登记三项交给用户定夺**：涂料链接误触面积（P29，整行 180×48px 可点且跳 GW 商店）、
灯箱工具栏按钮 32–36px 不足 44（P30，调大会影响观感）、
iOS 背景滚动锁不住（P31，需要改成 `position:fixed + top:-scrollY`，改动面较大）。

**agent 还指出一条已知项的优先级应提高**：Google Fonts 在大陆不可达，
`media=print onload` 保证不白屏，但**四个字体族全部回落** ——
客户看到的排版和我验收的排版是两套。这不是「以后优化」，是当前主力客群的实际观感。
P15 的紧迫性比原先判断的高。

### 2026-09-03 · 给「配平能过但规则串了」加门禁

今天两次都是**我的清理动作制造了新 bug**，而且两次都躲过了当时的检查：
删 `.display-latin` 时正则吃掉声明块（英文主标题变 15px 正文）、
批量迁移令牌时带空格的写法没匹配上（下拉白字白底）。
共同点是 —— **括号是平的、构建是绿的、审计是过的**。

所以给 `audit_content.js` 加了 `auditBuiltCSS()`：对**产物 CSS** 断言四条不变式，
每条都对应一个「曾经坏过或坏了代价很大」的地方：
1. `.display-1` 必须保留自己的字号（挡住选择器被串走）
2. `:lang(en)` 规则里**不许出现 font-size**（正是那个 bug 的特征）
3. `[hidden]` 必须带 `!important`（筛选与视图切换全靠它）
4. `--content-max: 1440px` 必须在（限宽是 §2-E 的核心决定）

`CSSInvariant` 列入阻断类型，pre-commit 会拒绝提交。

**门禁本身也踩了三个坑，都是实测才发现的：**
1. **加了但没调用** —— 函数定义好了却没人调，跑起来一片绿。
   **不运行的门禁比没有门禁更糟**，它给的是假的安全感。
2. **正则不容忍空白** —— minify 产出的是 `display:none !important`（带空格），
   我按 `display:none!important` 匹配，于是把好的报成坏的（假阳性）。
3. **随便挑了个 CSS 文件** —— `public/css` 里堆着历史 hash 文件，
   `find()` 可能查的是旧产物。改成从首页 HTML 里读出**当前真正被引用**的那个。

最后用「故意复现当初的 bug」验证过：能精确报出 `:lang(en) 规则只管字体不管字号`，
退出码 1。恢复后全绿。**门禁必须先证明它会失败，才能信它的通过。**

**顺带修完 agent 报告里的中危项：**
- `--yellow-light` 这个**全站未定义的第七种颜色**（fallback `#ffe27a`）改为 `--action`，
  六色锁定恢复
- 二维码 `object-fit:cover` → `contain`（源图 844×832 非正方，cover 会吃掉静区）
  并加白底、加 `flex-wrap` 防 320px 小屏挤压
- `<meta name="color-scheme" content="light dark">` 与 `tokens.css` 的 `color-scheme:dark`
  冲突，会让部分内核在 CSS 到达前用浅色渲染表单控件 → 首帧白闪。改为 `dark`

### 2026-09-03 · JS 语法门禁 + 灯箱降级复核

**加了 `auditJSSyntax()`**：扫 `assets/js/` 里的 8 类过新语法
（可选链 `?.`、空值合并 `??`、可选 catch 绑定、扩展 NodeList、`globalThis`、
`replaceAll`、`Array.at(-n)`、`structuredClone`），命中即阻断提交。
理由：这些在微信 X5 内核上是**解析期**错误 —— 整个文件一行都不执行，
而本机 Chrome 全支持，**本地永远测不出来**。
先故意塞回一处 `?.` 验证能抓（退出码 1），恢复后全绿。

**复核那批语法降级时，被环境骗了两次：**

1. **点击 plate 直接跳走并下载了 3648×3648 原图** —— 正是审计预测的失败模式，
   看着像我把 lightbox.js 改坏了。查 MIME 发现是 `text/plain`，
   且服务端返回的文件根本不含我的改动 —— **陈旧 hugo server**。
   （这条排查顺序是我自己写进 `CLAUDE.md` 的，这次真派上用场。）重启后正常。

2. **双击放大「不切原图」** —— 插桩后发现两次点击的实际间隔是 **997ms 而不是我要的 120ms**：
   标签页 `document.hidden` 为真时**浏览器把 `setTimeout` 节流到约 1 秒**，
   而双击判定窗口是 300ms，**根本进不去**。
   改用忙等 `while(Date.now()-t0<150){}` 后立刻通过：`_web.webp` → `custodes_11.webp` 原图。
   **代码一直是好的，是测试方法测不出来。**

已把这条连同 rAF、`getBoundingClientRect` 归零一起写进 `CLAUDE.md` ——
自动化浏览器测不了的三类东西，现在有明确清单和替代测法。

**灯箱其余实测通过**：打开不跳走、分享按钮不抛错且弹 toast（clipboard 守卫生效）、
方向键翻页 5/37、Esc 关闭。

**门禁本身又修了三处**（都是「我写的检查自己有 bug」）：
1. **只认生产文件名** —— dev 构建的 CSS 是 `viiyd.css`（不带 hash），
   正则只匹配 `viiyd.min.<hash>.css`，于是 `public/` 恰好是 dev 产物时
   **pre-commit 会误拒提交**。改成两种都认。
2. **没剥 CSS 注释** —— dev 构建不压缩，注释保留，而我的注释里正好写着
   `:lang(en) …` 这类示例，正则匹配到注释文本，**报出和真 bug 一模一样的错**。
   改成先 `replace(/\/\*[\s\S]*?\*\//g, '')`。
3. **没容忍分号** —— dev 版是 `display:none !important;`（有分号），
   minify 版没有。正则只认无分号形态。

现在 dev 与生产两种构建下都是 `No issues found`，破坏后仍能精确报出，pre-commit 全绿。
**一个只在一种构建模式下正确的门禁，等于一半时间在骗人。**

### 2026-09-03 · 两项移动端触控修复（P29 / P30 已解决）

**涂料清单不再整行可点。** 原来每一行（约 180×48px）都是 `<a href>` 指向
warhammer.com 商店 —— 移动端一屏排 1–2 列，误触面积极大，
而且**把客户从「这家工作室的作品页」送去 GW 官方店，与这一页的目的相反**。
涂料清单是**手艺的证据，不是导购**。
改成 `<div class="paint">`，只有涂料名是链接，色块与角色标签退回纯展示。
实测：整行 `<a>` 0 个、`<div class=paint>` 7 个、可点涂料名 7 个。

**灯箱工具栏按钮移动端 44px。** JS 用内联样式创建（`padding:6px` 包 20–24px 图标 ≈ 32–36px），
**内联样式接不了媒体查询** —— 所以给按钮加了 `.lb-btn` 类，尺寸交给 `components.css`。
桌面观感不变，`@media (max-width:768px)` 下 44×44。
实测 375px 视口：6 个可见按钮全部 `44px/44px`。

**移动端全页复扫**：低于 44px 的可点元素 **0 个**、无横向溢出。

若更想要「涂料完全不外链」（纯展示），说一声即可 —— 当前保留了名字上的链接，
因为材料透明度对高端客户是有说服力的。

### 2026-09-03/04 · 首页横滚 + 熊猫吉祥物 + 分区花格 + 一次线上事故

**首页「最近交付」6→12 条，移动端加横滚箭头。** 原来 ≤768 已经是横滚
（flex + overflow-x:auto，露 2.3 张），但滚动条被 `scrollbar-width:none`
隐掉、也没有任何箭头，用户看不出右边还有内容。新增 `assets/js/rail.js`：
44px 箭头按 `scrollLeft` 显隐，桌面无溢出直接 `display:none`。
桌面 6 列两行，769–1024 收成 4 列，≤768 `grid-auto-flow:column` 两行横滚。
实测两个坑：`grid-template-columns:repeat(6,1fr)` 优先于 `grid-auto-columns`，
移动端不显式写 `grid-template-columns:none` 会得到畸形列；`scroll-snap`
不配 `scroll-padding-inline` 会在加载时把 `scrollLeft` 顶到 20。

**碳纤维底纹改对角棋盘，6px→12px。** 原来两组 ±45° 的 1px 交叉细线在
暗底上实机读出来是「菱形网」，格子太小（3px 周期）看着像噪点。改成
两层 `linear-gradient` 对角棋盘错开半格，不用任何 1px 线，令牌收敛到
`--weave-cell` / `--weave-size` 两个。

**清理 3.0 遗留资产**：`static/` 里 41MB 只有 1.6MB 真被引用，删掉后
部署产物 49MB→9.6MB；关于页 front matter 里 6 个模板从不读的死字段
（`hero_bg`/`artist`/`pillars`/`gallery`/`social`）一并清掉；
`tailwind.config.js`/`postcss.config.js` 判断错误删了又加回来（见下）；
`content/zh/_index.md` 是个和中文站根路径重名的空 section，删掉后
`hugo --gc --minify` 从有 1 条 WARN 变零告警零错误。

**熊猫吉祥物**：用户用本轮给的提示词在 Gemini 生成三张图，选中两张接入站点——
`panda-desk.jpg`（熊猫画模型）用在首页询价区与关于页自述旁，
`panda-mark.png`（熊猫头）替掉顶栏圆环里的字母 V。裁图去掉了 Gemini
原图自带的白边/黑边/假英文水印，28px 缩略测试过标识仍可辨认。
图统一走 `assets/img/` + Hugo 构建期 `.Process` 转 WebP，不直接进 `static/`。
关于页那张第一版给了 300px 太小缩成缩略图，改大到 440px（正文列保持
`1fr` 让段落自己的 `max-width:44ch` 兜住，不要写成 `minmax(0,44ch)`——
试过，网格总宽塌到 967px，右边空出 300px 死区）。

**首页分区改花格底/纯深色错开一行，随后扩到全站。** `body` 保留全局
织纹背景不变；新增 `main > .section:nth-of-type(odd){ background-color:
var(--ink) }`，奇数位盖纯色挡住花格，偶数位透明露出 body 的花格透过来。
选择器落在 `main >` 而不是某个模板专属 class，是因为 8 个模板
（首页/关于/作品列表/作品详情/服务/分类页/term/404）的 `.section`
全部是 `<main>` 的直接子元素，一条规则通吃。

**一次真实的线上事故，教训写进了 CLAUDE.md「质量门禁」**：判断
`postcss.config.js` 「没有模板用到」时漏看了 `head.html:44` 的
`css.PostCSS` 调用（不受 `hugo.IsProduction` 限制，每次构建都跑），
删掉它连带 devDependencies 后本地一直不报错——因为本地 `node_modules`
是改 `package.json` 前装的，没有重新 `npm ci`，测的是假阴性。
CF Pages 每次构建都是干净 `npm clean-install`，从那次删除开始**连续
3 次 `Failure`**，期间两次熊猫改动的汇报都说了「已推送」，但线上其实
停在 3 小时前的旧版本。用 `wrangler pages deployment list --project-name=viiyd3-0`
才第一次看到真实构建状态。修复后改了工作方式：**往后每次 push 都用
wrangler 核实真实部署结果，不再只信 `git push` 没报错**。
