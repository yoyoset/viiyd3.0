# 内容策略——发布什么 (Content Idea Bank)

> 用途:回答"我该发什么"。先把「素材 → 可发内容」的转化方法看懂,再直接从「今天就能发的内容池」里抄。
> 适用身份:老板(丈夫)负责发,主理人(妻子)负责提供素材和一句心里话。夫妻俩只有两人,她还要画 40 小时一个模型——所以**一切内容都是从已完成的作品里反复挖,不是现场拍**。

---

## 一、核心原则:素材不是"拍",是"挖"

工作室真实产能:每月完成 **1~2 个新作品**(一个模型 40 小时上下)。如果只靠"新作品才发内容",一个月撑死 2 条,账号必然长草。

正确做法:**一份素材库,无限次角度复用**。每一个完成的作品,可以拆出 6~8 个不同角度的内容——整件展示、360° 视频、细节特写、配色思路、地台做法、画的过程回忆、客户的故事。这就是为什么下面第 3 节"现成内容池"里有 20 条,而仓库里只有 50+ 件作品。

**素材流(谁提供什么):**

| 素材 | 谁提供 | 何时提供 | 存到哪 |
|------|--------|---------|--------|
| 成品高清图(`_NN.webp` 原图) | 妻子(拍摄) | 作品发布当天 | R2 `viiyd-art-photos/[YYYY]/[MM]/[CODE]/` + `need_upload/` |
| 360° 视频(`[NAME].mp4`) | 丈夫(剪辑) | 有条件则每件做 | R2 `viiyd-art-photos/video/` |
| 一句心里话(画画时想到的) | 妻子 | 随时口头/语音 | 微信发给丈夫,丈夫抄进文档 |
| 旧作品的"新角度"文案 | 丈夫 + AI agent | 每周批量 | `content/work/*/social_media.md` |

> 关键机制:妻子只需要**在画的间隙说一句话**(发语音都行),剩下所有成文、选图、排期、发布都由丈夫 + AI agent 完成。妻子的时间优先级永远是:画画 > 拍图 > 说话。

---

## 二、内容类型清单(每种:适用场景 / 素材来源 / 文案模板 / CTA / 获客价值)

### 1. 作品展示(Finished Work Showcase)

- **适用场景**:新作品上线、旧作品重发(间隔 3 个月以上)。
- **素材来源**:`content/work/[slug]/` 的 cover + plates 网格图(`_01.._NN`);有 360° 视频的优先用视频。
- **文案模板**(基于 `content/work/[slug]/social_media.md` 已有示例,见 Bullgryns/Kasrkin):

  **EN:** "Finally finished [unit]. It took about [XX] hours, mostly because I kept [fussing/obsessing] over [small detail]. I wanted them to [emotion/idea, e.g. look like they'd been walking through a sandstorm for weeks]. The contrast between [A] and [B] turned out better than I thought. [one honest imperfection]. Full gallery: [link]."

  **ZH:** "这个 [unit] 终于画完了,前后大概 [XX] 小时,大部分时间在 [小细节,如较真皮扣/调整过渡]。我想让他们看起来是 [情绪/概念,如'在风暴里走了几个星期的幸存者']。这次 [A] 和 [B] 的对比出来效果比想象中好。唯一小遗憾是 [一句真实的不足]。[链接]"

- **CTA**:作品页链接("高清单图在网站 / Full gallery on the site")→ 引导到作品页,再由作品页的委托按钮承接。
- **获客价值**:**★★★★★ 最高**。这是直接展示"你能画成什么样",买家决策的核心依据。

### 2. 360° 视频

- **适用场景**:有 `video_360` 字段的作品(见 `layouts/work/single.html` 的 04a 区块)。
- **素材来源**:`photo.viiyd.com/video/[NAME].mp4`,已接入的作品:`silent-king`、`void-dragon`、`nightbringer`、`bloodcrushers`、`bloodmaster`(silent-king 还有 `menhir.mp4`)。视频字段在 work 页 frontmatter,双语都要加。
- **文案模板**:**EN:** "A slow turn around [project]. The [detail] catches the light differently every time. This is why I photograph everything in the round." **ZH:** "让 [project] 转一圈。每次转到一个角度,光线落点都不一样。这也是为什么每一件我都坚持 360° 记录。"
- **CTA**:同作品展示。
- **获客价值**:**★★★★★ 极高**。视频最能打消"图片是不是修过"的疑虑,也最好转发。

### 3. WIP 进度(Work in Progress)

- **适用场景**:新作品作画中(每件作品发 1~2 条,画到一半时);跨周大项目中间。
- **素材来源**:妻子随手拍的工作台/半成品(手机拍即可,不要求画质)。
- **文案模板**:**EN:** "Halfway through [unit]. [What's done] is done, [what's left] is the part I always dread/love. Coffee's on, brushes are out." **ZH:** "[unit] 画到一半了。[] 已经完成,剩下 [] 是最让我又爱又怕的部分。咖啡续上,继续。"
- **CTA**:无硬 CTA,评论区闲聊即可;偶尔带一句 "进度实时更新,完整过程会发到网站"。
- **获客价值**:**★★★☆☆ 中高**。展示"真人在画、过程透明",建立信任,适合沉淀熟客。

### 4. 教程 / 技巧分享(Tutorial / Tip)

- **适用场景**:每 2~4 周一条;素材用已有的细节大图,不需要现场录屏。
- **素材来源**:任一作品的细节图(如 NMM、OSL、迷彩、地台),配 3~4 步文字。
- **文案模板**:**EN:** "A tiny trick I use for [technique, e.g. lens glazes]: [3-step]. It's the reason [result]. Swipe for the close-up." **ZH:** "分享一个我做 [技法] 的小习惯:[三步]。这组镜头反光的通透感基本靠这个。第二张是放大细节。"
- **CTA**:轻量——"有想学的可以留言,我看哪条讲得多就先写哪条";成熟后可以引到作品页。
- **获客价值**:**★★★☆☆ 中**。涨粉/互动最有效,但带来的多是爱好者而非买家;定位是"池子里养鱼"。

### 5. Before / After

- **适用场景**:天然素材——JoyToy 头雕重涂(`joytoy-dark-source-steel-legion-head-repaint`)、3D 打印修复(`3d-print-custom-figure-chromatic` 克服层纹)。未来新增 reprint/repair 类委托都可出。
- **素材来源**:同一模型的重涂前/后对比图(客户端留档)。
- **文案模板**:**EN:** "Before vs after — [what changed]. Same figure, different story. Repaint commissions are honestly one of my favorites to take." **ZH:** "重涂前后对比。[什么变了]。同一个模型,换了一个故事。接重涂委托其实是我最喜欢的委托类型之一。"
- **CTA**:中——"如果你也有想救活的模型,可以来聊聊 / DM if you have a figure you want to bring back to life."
- **获客价值**:**★★★★☆ 高**。对比图最直观,收藏和转发率都高。

### 6. 客户返图 / 客户故事(Client Story)

- **适用场景**:完成交付后,客户拍到手/上桌的反馈;或讲述"这个委托是怎么来的"。
- **素材来源**:客户微信/邮件返图(需征得同意)、交付打包照片、作品页描述里的委托背景。
- **文案模板**:**EN:** "This one was a bit special — [client story, e.g. it was a gift for someone who'd just finished chemo, they'd never painted themselves and wanted a piece that felt like 'theirs']. [Detail] was their one request. [Result]. Thank you for trusting me with it." **ZH:** "这件有点特别——[客户故事,如'是送给出院朋友的礼物'、'客户自己从不涂装,只想要一件'属于自己'的作品']。TA 唯一的要求是 []。做的时候一直记着这个。谢谢你把 TA 交给我。"
- **CTA**:中——"委托开放中 / commissions open"。
- **获客价值**:**★★★☆☆ 中高**。信任背书,但对隐私敏感,必须征得同意。

### 7. 工具 / 颜料分享

- **适用场景**:一周里最轻松的内容;素材用工作台随手拍。
- **素材来源**:`/img/studio/`(已有 6 张工作室图:`_WER0410` 全景 / `_WER0411` 调色盘 / `_WER0419` 工作台 / `_WER0413` 灯光 / `_WER0414` 颜料架 / `_WER0426` 展示柜);`content/work/*/index.md` 的 `paints:` 字段(真实用漆)。
- **文案模板**:**EN:** "Current [palette/brush/setup] for [project]. The [paint] is doing all the heavy lifting this week." **ZH:** "这个项目在用的 [颜料/笔/布局]。[那支漆] 这周承担了大部分工作。"
- **CTA**:无或极轻。
- **获客价值**:**★★☆☆☆ 低**。维持存在感、互动闲聊,不直接获客。

### 8. 工作室日常(Studio Life)

- **适用场景**:情绪低谷、节假日、画到半夜、猫/茶/咖啡等生活碎片。
- **素材来源**:手机随手拍,不挑画质。
- **文案模板**:**EN:** "Tonight's setup: one lamp, one mug, one very patient [model]. Long week, good kind of tired." **ZH:** "今晚的配置:一盏灯、一杯茶、一个很耐心的 [model]。这周很长,是那种画到爽的累。"
- **CTA**:无。
- **获客价值**:**★☆☆☆☆ 最低**。纯粹人设保温。但**不能没有**——全发硬核作品会显得像批发商,这也是"反 AI 感"的一部分。

### 9. 细节特写 / 配色思路 / 地台做法(旧作品反复挖角度)

- **适用场景**:任何"这周没有新素材"的时候。**这是整个内容库的兜底机制。**
- **素材来源**:任一作品的高清细节图——每件作品都能挖出至少 3 个角度:
  - 细节特写(鳞片/迷彩/金属/镜片反光)
  - 配色思路(主色→过渡→点缀,可用 `paints:` 字段)
  - 地台做法(场景、泥土、植被)
  - 某个技法(OSL/NMM/freehand)
  - 客户的一句话要求("唯一的要求是...")
- **文案模板**:**EN:** "Going back to [project] because I can't stop looking at [detail]. [Why it works — 2 sentences]." **ZH:** "翻到 [project] 的这张图,忍不住盯着 [细节] 看。[为什么它成立——两句话]。"
- **CTA**:轻量作品页链接。
- **获客价值**:**★★★☆☆ 中**。虽然是重复素材,但对"第一次刷到你的新人"来说全是新内容。

---

## 三、今天就能发的内容池(20 条,直接抄)

> 规则:渠道写 IG = Instagram 轮播/帖,公众号 = 公众号长文,X = 简短文。所有图片 URL 都是仓库 frontmatter 里真实存在的。标注"需看图挑图"的,是指 `_NN` 编号的具体图我无法确认内容,需丈夫打开对应作品页挑一张(或直接让 AI 按标题选)。
> 编号 `_NN` 对应 `content/work/[slug]/index.md` 的 `cover` + `photos:` 网格(第 N 张)。

| # | 渠道 | 类型 | 素材(真实 URL) | 标题(建议) | 文案要点 | CTA |
|---|------|------|----------------|------------|---------|-----|
| 1 | IG(视频/Reel) | 360° 展示 | `photo.viiyd.com/video/silent-king.mp4` | "60 hours of the Silent King" | 60h、Legend 档、高斯绿 OSL 铺满整座 Barge;转一圈光线不停在变 | 作品页链接 |
| 2 | IG(视频/Reel) | 360° 展示 | `photo.viiyd.com/video/void-dragon.mp4` | "A god of machines, on the turn" | 35h、C'tan 虚空龙、银身+高斯闪电、废墟地台 | 作品页链接 |
| 3 | IG(视频/Reel) | 360° 展示 | `photo.viiyd.com/video/nightbringer.mp4` | "Death, rotating slowly" | 30h、夜之君主、紫黑长袍+高斯绿触须;文案可带一点"死亡本身"的意象 | 作品页链接 |
| 4 | IG(视频/Reel) | 360° 展示 | `photo.viiyd.com/video/bloodcrushers.mp4` | "Six Bloodcrushers, 40 hours" | 40h、六头恐虐骑兵、血祭色调;上周的血魔 Herald 是它们的将领(联动) | 作品页链接 |
| 5 | IG(视频/Reel) | 360° 展示 | `photo.viiyd.com/video/bloodmaster.mp4` | "The Herald who leads the charge" | 22h、恐虐血魔、单体英雄位;顺带讲血魔和血碾的"将领带兵"委托故事 | 作品页链接 |
| 6 | IG 轮播 | 作品展示 | Bullgryns:`bullg_01` 合照→`_11` 面部→`_14` 背包→`_08` 地台→`_30` 氛围 | "Quiet weekend with three desert wanderers" | **文案已写好**在 `content/work/2026-01-23-bullgryns-.../social_media.md`,直接抄(35h、废土幸存者、绿色镜片) | 作品页链接 |
| 7 | IG 轮播 | 作品展示 | Kasrkin:`kasrkin_01` 队长→`_19` 全家福→`_11` 迷彩→`_03` 狙击手→`_12` 地台 | "Precision is everything for Kasrkin" | **文案已写好**在 `content/work/kill-team-kasrkin/social_media.md`,直接抄(35h、硬边迷彩、多层罩染镜片) | 作品页链接 |
| 8 | IG 轮播 | 细节特写 | Miao Ying:`miaoyingdragon_07`(cover,龙鳞/冠/云鞍) | "Amethyst scales up close" | 48h、紫晶鳞片+珍珠白鬃毛、金冠玫瑰石;放大看鳞片过渡 | 作品页链接 |
| 9 | IG 轮播 | 细节特写 | Silent King:`silent-king_12`(OSL 光晕溢色)→`_06` 高斯王座→`_13` 地台 | "How green light bleeds across black" | 用"灯是怎么'污染'周围金属"讲 OSL 思路;60h 项目里最喜欢的三张 | 作品页链接 |
| 10 | IG 单图 | Before/After | JoyToy 头雕重涂:`joytoy-dark-source-steel-legion-head-repaint` cover | "Same head, different person" | 重涂前后对比;成品头部 vs 原厂;重涂委托 = 救活你不满意的模型 | "有想救活的模型可以来聊" |
| 11 | IG 轮播 | 配色/3D打印 | Chromatic:`3d-print-custom-figure-chromatic` cover | "3D print, but make it chromatic" | 20h、3D 打印树脂、用高饱和渐变+OSL 盖掉层纹(天然教程角度) | 作品页链接 |
| 12 | IG 轮播 | 双方案展示 | Defiler:`defiler` cover(viiyd20260605defiler_01) | "One Defiler, two schemes" | 40h、混沌魔引擎、一半黑金(黑军团)一半黄黑警戒线(钢铁之爪);可换臂是卖点 | 作品页链接 |
| 13 | IG 轮播 | 地台特写 | Devlan Tallarn:`devlan_01` cover | "Desert troopers that walk on sand" | 沙漠小队、Tatooine 感、头巾改造;重点讲地台和"尘"的质感 | 作品页链接 |
| 14 | IG 轮播 | 军团双风格 | Dark Angels 两件联动:`deathwing` cover + `interemptors-dreadwing` cover | "One Legion, two moods" | 同是暗黑天使:死亡翼奶油白 vs 毁灭翼哑光黑+等离子 OSL;展示风格跨度 | 作品页链接 |
| 15 | IG 轮播 | 颜色思路 | Tzeentch 三连:`screamers` cover → `pink-horrors` cover → `blue-horrors` cover | "Blue to pink to blue again" | 粉鬼分裂成蓝鬼、蓝紫渐变、发光边缘;三件放一起讲"同一谱系的色相游戏" | 作品页链接 |
| 16 | 公众号 | 长文(月更) | Silent King 全记录 + 双视频(`silent-king.mp4`+`menhir.mp4`)+ `_14` 全家福 | 《60 小时,这座沉默之王的巨舰》 | 结构:为什么接/灵感 → 颜色(虚空黑 vs 高斯绿)→ 技术(全谱 OSL、石与金属的质感差)→ 结尾"展示位每季度只开两个" | 点击原文到作品页 |
| 17 | 公众号 | 长文(月更) | Bullgryns 素材(`social_media.md` 里有完整长文草稿) | 《35 小时,我和这三个"流浪者"》 | **草稿已在** social_media.md,直接复制扩充 | 点击原文到作品页 |
| 18 | IG 单图 | 教程/技巧 | Kasrkin `_11` 硬边迷彩细节 | "Hard-edge camo in 3 steps" | 3 步:底色 → 几何色块 → 边缘缝线;配一张放大图 | 评论里留言想学的技法 |
| 19 | IG 单图 | 工具分享 | `/img/studio/_WER0414.jpg`(颜料架)+ 某项目 `paints:` 字段 | "This week's palette" | 真实用漆清单(从 frontmatter `paints:` 抄),讲为什么选这几支 | 无 |
| 20 | IG 轮播 | 老作品重发(桌面效果) | Plague Marines 死亡守卫:`plague` cover + 选 2 张细节 | "70 photos later, still my favorite green" | 60h、纳垢锈化+有机突变;重点:旧作重发,配"这件是去年让我最纠结的绿色" | 作品页链接 |

> **优先顺序**:第 1~5 条(360° 视频)先发——视频是全网最稀缺的素材,新账号靠它拉数据;第 6、7 条零成本直接抄(文案已写好);其余按需排进 CALENDAR.md。

---

## 四、没素材时的兜底清单(从已完成作品里反复挖)

当上面 20 条发完、又没有新作品时,按下面角度循环挖**旧作品**。每个作品至少能出 3 条:

1. **细节特写**:挑一张图放大,只讲"这一小块"。例:凯斯金镜头反光、妙影鳞片、死守守卫锈迹、自由民骑手旗帜、浩克森红海盗臂甲。
2. **配色思路**:用 `paints:` 字段列出真实用漆,讲"主色→过渡→点缀"。例:黑金的克制 / 红金的皇家感 / 蓝紫的混沌。
3. **地台做法**:挑地台图,讲"这块地台是怎么做出来的"(土、尘、植被、废墟)。
4. **一个技法**:OSL(静默王、死守守卫、Interemptors)、NMM(莱昂·庄森、钢铁之爪)、freehand(晴空灯大帆船 dragon stencil)、湿混渐变(Tzeentch)。
5. **客户故事**:从作品页 `tagline`/正文里挑一句委托背景,讲"客户只要了一件事"。
6. **"我也纠结过"**:讲一件作品里失败过又救回来的细节——真实感 > 完美。
7. **对比/联动**:同一军团两件作品对比(第 14 条)、同系列继续做(`grand-cathay-cavalry-red-gold-recolor` 与 `regiment-ii` 是同一系列第二团)。

**兜底节奏**:每件旧作品每 3 个月最多挖 2 条,避免粉丝"见过"。

---

## 五、哪些类型对获客有效,哪些只是维持存在感

| 类型 | 获客价值 | 存在感价值 | 频率建议 | 定位 |
|------|---------|-----------|---------|------|
| 作品展示(含 360° 视频) | ★★★★★ | ★★★★★ | 每月 2~3 条 | **主力**——买家决策依据 |
| Before/After | ★★★★☆ | ★★★★☆ | 有素材就发(约月 1 条) | **高杠杆**——对比最直观 |
| WIP 进度 | ★★★☆☆ | ★★★★★ | 每作品 1~2 条 | 信任建设 |
| 教程/技巧 | ★★★☆☆ | ★★★★☆ | 每 2~4 周 1 条 | 池子里养鱼,别指望直接成交 |
| 客户故事 | ★★★☆☆ | ★★★☆☆ | 每月最多 1 条 | 背书,注意隐私 |
| 细节/配色/地台(旧作挖角) | ★★★☆☆ | ★★★★★ | **兜底主力** | 本周没新素材就发这个 |
| 工具/颜料分享 | ★★☆☆☆ | ★★★☆☆ | 每 2~4 周 1 条 | 填充 + 闲聊 |
| 工作室日常 | ★☆☆☆☆ | ★★★★☆ | 每周 0~1 条 | 人设保温,别超过 1 条/周 |

> 一句话:**作品展示(before-after 也算)负责成交,其余负责让别人认识你、相信你**。前 20% 的内容带来了 80% 的询价,说的就是"作品展示"这一类。
