# 内容精修循环（2026-09 起）

> 由 `/loop` 自动推进的站点文案与细节精修。每轮挑一到几项：改 → 审计 + 干净构建 + 产物核对 →
> 单独提交 → push → `wrangler` 核实部署。
> 与 `REDESIGN_4.0_PLACEHOLDERS.md` 的分工：那边登记「等素材 / 等拍板」的占位（P 编号），
> 这里只放**不需要新事实就能做**的改进（L 编号）。需要事实的发现一律转登记到 P 表或本文末「待您确认」，不编造。

## 规则

- **不编造事实**：颜料、设备、工时、客户、数量、档期都不写猜的。宁可删掉也不留猜测值。
- **不动**：`data/pricing.yaml` 系数、表单链路（Worker → D1 → Telegram）、SEO 配置与 URL、`defaultContentLanguage`。
- **不加 AI 署名**：「Opus 5.5 制作」等您拍板（见「待您确认」）。
- 中文文案按敬语定稿标准（见 memory `feedback_viiyd_voice_tone`）：用「您」、得体，但**不自贬、不防备、不翻译腔**。
- 每项单独提交；文案改动在下方「改动记录」留 before/after，方便整条回滚。

## 待办

| # | 项目 | 位置 | 状态 |
|---|---|---|---|
| L1 | 兽人页的颜料表是看照片猜的，页面显示成「调色清单 12 色」 | `content/work/orks-bad-moons-meganobz-mega-armour/` | ✅ 已删，正文残留块一并删 |
| L2 | 英文 FAQ 三条过时且与正文矛盾（五档 tier、按档工期表、IG 私信询价） | `i18n/en.toml` `faq_*` | ✅ ad67131 |
| L3 | 浮层硬编码：中文站出现 `Close ×`、`Stored on Cloudflare D1 … nothing else, ever`；英文站出现「请耐心一两天 ❤️」 | `layouts/partials/commission-modal.html` | ✅ 5c0ae7a |
| L4 | 浮层中文病句 / 翻译腔：「恐怕慢工赶不上您的期」「把作品交给我，和一个截止日期」「您的消息已固定在我的手机上」「请选择...…」、对国内客户讲 Telegram Pin | `i18n/zh.toml` `cm_*` | ✅ 5c0ae7a |
| L5 | 首页「剩下的部分，我们一起为您理清楚」（「一起」与「为您」矛盾） | `i18n/zh.toml` | ✅ ba6f201 |
| L6 | 英文 tagline「the commissions others turn down」与中文「得耐着性子慢慢磨的委托」承诺不一致，也与关于页「最擅长两类」冲突 | `i18n/en.toml` | ✅ 2b2aba3 |
| L7 | 英文加急提示「I might pass.」生硬，中文版是客气的 | `i18n/en.toml` | ✅ 2b2aba3 |
| L8 | 关于页「已交付 56」「400+ 档案图片」写死，已与作品数脱节 → 改成模板按作品页自动计算 | `layouts/_default/about.html` + `i18n` | ✅ 41dcd24（实际 59 篇 / 1561 张，原来少报约 4 倍） |
| L9 | 关于页自述第三段自贬 + 防砍价语气、「竹子须一节一节地啃」比喻违和（P22：本就是占位稿） | `i18n/zh.toml` `about_bio_3` | ✅ 94799f9（仍属 P22 占位，您本人重写优先） |
| L10 | 审计脚本查不到 i18n 里的「待补充 / TBC」→ 加一条**警告级**检查（不阻断构建，P23 仍在） | `scripts/audit_content.js` | ✅ 0fcb57c |
| L11 | 59 篇作品页 `share_caption` 中文是否还有「你」而非「您」、标题/summary 是否有翻译腔 | `content/work/*/index.zh.md` | ✅ 「你」2685fb2；标题/summary f8d21ca（20 篇，见下方明细） |
| L13 | 构建报 i18n 缺失 `sys_`：/system/ 根页用空 Term 拼 key；顺带发现该页把「6 个系统」写成「6 个委托单」、名字显示 slug | `layouts/_default/taxonomy.html` | ✅ 153ef4b（term.html 实测是死文件，已删） |
| L12 | 可扩展点巡检：分类落地页导语、404 文案、图片 alt、单页结构化数据等 | 全站 | 🔶 已查：/system/* 标题与描述本地化 c93fe8d；5 篇 description 去档位词与「我们」b53fa7b；404 双语、JSON-LD VisualArtwork 已具备；图集 alt 为「标题 — 01」偏弱但无逐图信息，暂不动 |

| L14 | 英文 i18n 全文通读 | `i18n/en.toml` | ✅ 文案本身无硬伤；顺带查出服务页 JSON-LD 向搜索引擎声明「五档」（65f01b9 删）、服务页中文 description 残留「你」（972c25e） |
| L15 | 死 i18n 键：`tier_*_desc` `size_*` `svc_tiers_label` `svc_see_tier` `svc_legend_cta` `svc_sizes_label`，模板已无引用 | `i18n/*.toml` | 登记不删（不可见、无害；若将来恢复档位说明可复用） |

## 待您确认（需要事实或拍板，循环不会替您决定）

- **「两单」口径**（站点 meta description 也写「每季度仅开放两个展示位」，搜索结果里可见）：首页/浮层写「每次仅接两单」，关于页写「每季展示位 2」，档期写「2 个展示位开放中」。到底是同时两单还是每季两单？（对应 P6、P9）
- **关于页设备三项**（喷笔、光箱与拍摄、地台材料）：真实型号，或决定整块删掉。（P23）
- **兽人页颜料表**：若想恢复，请给真实用过的颜料清单。
- **「Opus 5.5 制作」署名**：建议只在页脚小字写 “Site built with Claude · all miniatures hand-painted by VIIYD”，您拍板后再加。

## 改动记录

| 日期 | 提交 | 改前 | 改后 |
|---|---|---|---|
| 09-26 | 6094387 | 兽人页「调色清单 12 色」（猜的） | 删除，等真实清单 |
| 09-26 | ad67131 | EN FAQ: Five tiers / per-tier turnaround / DM on Instagram | 对齐中文四条：EIU、寄送、分批、复刻配色 |
| 09-26 | 2b2aba3 | the commissions others turn down / I might pass. | the commissions that need patience / 说明档期原因 |
| 09-26 | 5c0ae7a | 把作品交给我，和一个截止日期。 | 把模型交给我，再告诉我您何时需要。 |
| 09-26 | 5c0ae7a | 恐怕慢工赶不上您的期，还望见谅。 | 若档期已满，可能无法如期完成，还望见谅。 |
| 09-26 | 5c0ae7a | 您的消息已固定在我的手机上。 | 您的消息已送达我的手机。 |
| 09-26 | 5c0ae7a | 以 Telegram Pin 消息的形式发送到我的手机 | 只会发送到我本人的手机上，不作他用 |
| 09-26 | 5c0ae7a | 中文站副标签重复（怎么称呼您？· 您的称呼） | 副标签改英文（· Name），与英文站的中文副标签对称 |
| 09-26 | ba6f201 | 剩下的部分，我们一起为您理清楚。 | 其余的细节，我们再慢慢商量。 |
| 09-26 | ba6f201 | 欢迎发给我，为您详细说明。 | 欢迎发来，我再为您细说。 |
| 09-26 | 41dcd24 | 关于页：已交付 56 / 400+ 档案图片（写死） | 作品档案 59 / 档案图片 1500+（模板实时计算） |
| 09-26 | 94799f9 | 并非有意刁难…辜负了手艺，也辜负了您的信任…恕我不太擅长议价…竹子须一节一节地啃 | 报价要等看过实物照片再给，这样说出口的数字才靠得住；价格一般不做议价…我们就从一张照片开始 |
| 09-26 | 2685fb2 | 如果你手上有个… / 如果你想要一个… | 若您手上也有一位… / 若您也想要一个… |
| 09-26 | 153ef4b | /system/：System · 6 个委托单 · Old-World | 按系统浏览 · 6 个系统 · 每系统一卡（旧世界 13 个委托单） |

### f8d21ca 作品 summary / 标题明细（09-26）

| 页面 (字段) | 改前 | 改后 |
|---|---|---|
| aeldari-swooping-hawks-showcase (title) | 灵族 飞鹰展示 (Aeldari Swooping Hawks Showcase) | 灵族飞鹰：道途武士展示 |
| black-myth-wukong-chibi (summary) | 对美猴王的风格化'Q版'诠释，平衡可爱比例与粗糙、写实的材质。 | 天命人的 Q 版造型：比例圆润可爱，材质依旧粗粝写实。 |
| blue-horrors-tzeentch-chaos-daemons (summary) | 粉色惧妖分裂后的残余。对冷色调蓝色渐变和魔法火焰效果的研究。 | 粉色惧妖分裂后的残余。冷蓝渐变，配魔法火焰效果。 |
| dark-angels-deathwing (summary) | 第一军团的内环。大师级涂装标准。 | 第一军团的内环精英。 |
| dark-angels-deathwing (summary) | The inner circle of the First Legion. Painted to a Master standard. | The inner circle of the First Legion. |
| flesh-hounds-khorne-daemons-showcase (summary) | 恐虐的猎犬。SPEC OPS级别涂装，高对比度和桌面耐用性。 | 恐虐的猎犬。高对比度配色，兼顾桌面耐用性。 |
| flesh-hounds-khorne-daemons-showcase (summary) | The hounds of Khorne. Painted to a Spec Ops standard for high contrast and tabletop durability. | The hounds of Khorne, painted for high contrast and tabletop durability. |
| legio-custodes-caladius-grav-tank-annihilator (summary) | 帝皇神选的重型反坦克火力。涂装为精英级标准。 | 帝皇神选的重型反坦克火力。 |
| legio-custodes-caladius-grav-tank-annihilator (summary) | Heavy anti-tank firepower for the Emperor's chosen. Painted to an Elite standard. | Heavy anti-tank firepower for the Emperor's chosen. |
| lion-el-jonson (summary) | 第一军团之主归来。大师级涂装标准。 | 第一军团之主归来。 |
| lion-el-jonson (summary) | The Lord of the First returns. Painted to a Master standard. | The Lord of the First returns. |
| kill-team-blood-and-zeal-sanctifiers (summary) | 一支经过重度改造的纯洁者杀戮小队，以此这展现OSL等离子效果和NMM金色金属镶边。 | 一支经过重度改造的纯洁者杀戮小队，重点展现 OSL 等离子效果与 NMM 金色镶边。 |
| pink-horrors-tzeentch-chaos-daemons (summary) | 诞生于亚空间能量的扭曲生物，尖锐的笑声回荡在战场上。采用多层罩染和空灵的发光效果，以捕捉奸奇的本质。 | 诞生于亚空间能量的扭曲生物，尖笑声回荡战场。多层罩染配空灵的发光效果，表现奸奇的诡谲。 |
| plague-marines-death-guard-nurgle (summary) | 莫塔里安的不屈子嗣。经典的死亡守卫配色方案，专注于干净的底漆和凹槽阴影。 | 莫塔里安的不屈子嗣。经典死亡守卫配色，底色干净，凹槽阴影扎实。 |
| plague-marines-death-guard-nurgle-showcase (summary) | 死亡守卫的腐朽老兵战士，展示了高阶的战损表现与有机的变异效果。 | 死亡守卫的腐朽老兵，重点在战损质感与有机变异效果。 |
| screamers-of-tzeentch-chaos-daemons (summary) | 在空气和亚空间中滑翔的噩梦生物，在身后留下扭曲的现实。涂装采用蓝紫色渐变和发光的边缘，以捕捉它们空灵的威胁感。 | 在空气与亚空间中滑翔的噩梦生物，所过之处现实扭曲。蓝紫渐变配发光边缘，突出空灵的威胁感。 |
| tahlia-vedra-lioness-of-the-parch (summary) | 帕奇的雌狮骑着狮鹫奔赴战场。这是西格玛之城的核心模型，具有雄伟的狮鹫和复杂的角色细节。 | 帕奇的雌狮骑狮鹫奔赴战场。西格玛之城的核心模型，狮鹫雄伟，角色细节繁复。 |
| warhammer-painting-beginner-guide (summary) | 开始您的战锤微缩模型涂装之旅的综合指南。涵盖基本工具、技法和工作区设置。 | 战锤微缩模型涂装入门：基本工具、技法与工作台布置。 |
| wildercorps-hunters-cities-of-sigmar (summary) | 西格玛之城粗犷的侦察兵，由他们忠诚的追踪犬陪伴。采用自然色调、皮革纹理和做旧效果涂装。 | 西格玛之城的粗犷斥候，身边跟着忠诚的追踪犬。自然色调、皮革质感与做旧效果。 |
| wuxia-board-game-miniature-painting-test (summary) | 武侠主题桌游的角色微缩模型。探索不同的调色板和光照效果，以捕捉武术精神。 | 武侠主题桌游的角色模型，尝试不同配色与光影，表现武侠气韵。 |
| zenestra-matriarch-of-the-great-wheel-cities-of-sigmar (summary) | 大转轮教派的教宗，乘坐神圣的轿子奔赴战场。这是一个核心模型，具有风化的石头、神圣的布料和虔诚的追随者。 | 大转轮教派的教宗，乘神圣轿辇奔赴战场。核心模型：风化石质、圣布与虔诚的随从。 |
| noise-marines-slaanesh-chaos-space-marines (summary) | 声波武器和鲜艳的色彩。一队用震耳欲聋的嘈杂声荣耀色孽的噪音战士。 | 声波武器配鲜艳色彩，一队以震耳噪音礼赞色孽的噪音战士。 |
| 3d-print-custom-figure-chromatic (summary) | 针对3D打印树脂件的色彩重构研究。通过高饱和度渐变和光源效果克服打印层纹。 | 针对 3D 打印树脂件的配色重构：用高饱和渐变与光源效果压住打印层纹。 |

### b53fa7b 作品 description 明细（09-26）

| 页面 | 改前 | 改后 |
|---|---|---|
| dark-angels-deathwing/index.zh.md | 第一军团的内环。大师级涂装标准。旨在成为暗黑天使军队中无可争议的焦点。我们优先处理了长袍的体积照明和忠诚之剑上引人注目的'爆裂能量'效果。 | 第一军团的内环精英，定位是暗黑天使军中的视觉焦点。重点在长袍的体积光，与忠诚之剑上的「爆裂能量」效果。 |
| dark-angels-deathwing/index.md | The inner circle of the First Legion. Painted to a Master standard. Designed to be the undisputed focal point of a Dark Angels army. We prioritized volumetric lighting on the cloak and a striking 'crackling energy' effect. | The inner circle of the First Legion, painted as the focal point of a Dark Angels army. The priorities were volumetric lighting on the robes and a crackling-energy effect on the sword. |
| flesh-hounds-khorne-daemons-showcase/index.zh.md | 恐虐的猎犬。SPEC OPS级别涂装，旨在实现高对比度和桌面耐用性。皮肤使用了经典的恐虐红配方，并进行了深层阴影处理以突出肌肉线条。 | 恐虐的猎犬，追求高对比度与桌面耐用性。皮肤用经典恐虐红配方，深阴影压出肌肉线条。 |
| flesh-hounds-khorne-daemons-showcase/index.md | The hounds of Khorne. Painted to a Spec Ops standard for high contrast and tabletop durability. The skin uses a classic Khorne Red recipe with deep shading for muscular definition. | The hounds of Khorne, painted for high contrast and tabletop durability. The skin uses a classic Khorne red recipe with deep shading for muscle definition. |
| legio-custodes-caladius-grav-tank-annihilator/index.zh.md | 黄金军团的重型驱逐者。具有精致的金色金属色和干净的红色点缀。该委托以精英级标准执行，以确保大面积的金色装甲板看起来丰富有趣，而不是平淡无奇。 | 黄金军团的重型驱逐者。精致的金色金属色配干净的红色点缀，重点是让大面积金甲板有层次，不显平淡。 |
| legio-custodes-caladius-grav-tank-annihilator/index.md | The Golden Legion's heavy destroyer. Featuring refined gold metallics and clean red spot colors. This commission was executed at Elite Tier to ensure the large gold panels remained interesting rather than flat. | The Golden Legion's heavy destroyer: refined gold metallics with clean red spot colours, worked so the large gold panels stay interesting rather than flat. |
| lion-el-jonson/index.zh.md | 狮王不再沉睡。作为暗黑天使军队无可争议的焦点，这是一件大师级的核心展示模型。我们重点刻画了披风的丰富体积光影，以及效忠之剑上醒目的NMM风格能量效果，以展现原体的威严。 | 狮王不再沉睡。作为暗黑天使军中的核心展示模型，重点刻画披风的体积光影，以及效忠之剑上醒目的 NMM 风格能量效果，衬出原体的威严。 |
| lion-el-jonson/index.md | The Lion sleeps no more. A centerpiece display model focusing on high-contrast NMM-style power weaponry and rich, volumetric cloak rendering. Executed as a Master Tier centerpiece, designed to be the undisputed focal point of a Dark Angels army. | The Lion sleeps no more. A centrepiece display model for a Dark Angels army, built around high-contrast NMM-style power weapons and rich volumetric cloak shading. |
| dark-angels-interemptors-dreadwing/index.zh.md | 第一军团的毁灭者。哑光黑色护甲上的高对比度OSL等离子效果。我们专注于最大化虚空般的黑色护甲与过充等离子线圈之间的对比度。明亮的OSL效果穿透哑光护甲，创造出配得上第一军团毁灭者的视觉冲击力。 | 第一军团的毁灭者。哑光黑甲上的高对比度 OSL 等离子效果：把虚空般的黑甲与过充的等离子线圈之间的对比拉到最大，让光穿透哑光护甲。 |
| dark-angels-interemptors-dreadwing/index.md | The destroyers of the First Legion. High-contrast OSL plasma effects on matte black armor. We focused on maximizing the contrast between the void-black armor and the overcharged plasma coils. | The destroyers of the First Legion: high-contrast OSL plasma on matte black armour, pushing the contrast between void-black plates and overcharged plasma coils. |
