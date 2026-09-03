# 线索处理 SOP(Telegram 收到委托后怎么做)

> 用途:从"Telegram 弹出新委托通知"到"定金到账开工",每一步该做什么、说什么。这是全漏斗里**最不该丢单**的一段——系统已经帮你把线索推到面前了,剩下的纯看人。
> 适用:丈夫负责第一响应(白天上班,晚上处理);妻子负责技术判断(价格/工时)。响应承诺:**24 小时内首次回复**(工作日白天可能延迟到晚上,晚上 21:00 前集中处理一次)。

---

## 第一步:分类(收到通知后 5 分钟内判断)

Telegram 新委托通知带工单号 `VY-YYYYMMDD-XX`。先看字段:name / contact / project / tier / deadline / notes / reference_urls。分三类:

| 类别 | 判断标准 | 动作 |
|------|---------|------|
| **A 类:可即时报价** | project + tier 明确、数量清楚、无需参考图(或已传)、deadline 宽松 | 当晚直接用第三节报价模板回复(不问多余问题) |
| **B 类:需追问** | 信息缺一:项目类型/数量/tier 选了 unsure/没传参考图/有特殊需求(双方案、场景地台、磁化、repaint);或**高价值单**(疑似展示级/殿堂级,如 centerpiece、大型载具、军团整队) | 24h 内发一封追问,问题**一次问完**,列 1~4 条,别再挤牙膏 |
| **C 类:疑似垃圾/无效** | 无 contact 或乱填、project 是"hi"/"test"/乱码、明显非委托意图 | 不回复,标记 C 类,48h 无真实沟通直接关闭工单 |

**判断辅助**:
- 表单里 `tier` 是预算档:`tabletop(¥120+)` / `display(¥600+)` / `unsure`。**它只是预算信号,不是最终报价**。
- 报价始终以 `/rates/` 三档为准(战场标准 / 阅兵标准 / 殿堂典藏)。⚠️ **待确认**:表单预算档与网站三档命名/价格对不上,报价前需确认网站价格单位与档位对应关系(见文末待确认)。
- 参考图会存 R2 `viiyd-commission-refs/`,URL 会出现在 `reference_urls`。没图的先看 notes 里有没有描述。

---

## 第二步:状态标记(用钉住的 Telegram 消息当工单看板)

> **先说清一个现状事实**:通知消息上的 Accept/Decline/Reply 内联按钮**当前不会触发任何动作**——`workers/commission/src/index.js` 只实现了 `POST /api/commission` 和 `/api/commission/upload`,没有处理 Telegram `callback_query` 的入口,按了按钮不会有反应。**这不是配置问题,是还没写这个功能。**(接入方式见文末"以后再做"。)
>
> 所以"按钮怎么用"分两层:**现在能用的是钉住消息 + 手动编辑**,按钮是设计意图、接入后才生效。

### 钉住消息管理规则(现在就能做)

1. **每来一条新委托,通知会自动钉到聊天顶部**,这就是你的"进行中工单"。
2. Telegram 私人聊天里钉住消息可以有多条,但**只保留 ≤3 条**——超过说明该清理了。
3. 手动编辑钉住消息,在文本开头补状态标签:
   - `🟡 NEW`(刚来,未处理)→ 处理完更新
   - `✅ ACCEPTED · 已报价 VY-... `(接单)
   - `💰 DEPOSIT PAID`(定金到账,开工)
   - `❌ CLOSED · 已取消`(拒单/无效)
   - `✅ DELIVERED`(已交付)
4. 状态变化时**直接在 Telegram 里编辑那条消息**(长按 → Edit),不需要动 D1。
5. 工单关闭(交付或拒单)后**立即取消钉住**(Unpin),保持顶部只留活单。

### Accept / Decline / Reply 按钮的设计意图(接入后)

| 按钮 | 意图 | 接入后行为(建议实现) |
|------|------|---------------------|
| ✓ Accept | 确认接单 | 把 D1 `status` 改成 `accepted`,消息自动加 "✅ ACCEPTED" 并提示下一步 |
| ✗ Decline | 拒单 | `status` → `declined`,消息加 "❌ DECLINED";可选带一句拒因 |
| ↩ Reply | 追加客户补充信息 | 手动把客户回复拼进消息(现在就是手动编辑,见上) |

---

## 第三步:24 小时内回复(话术模板)

### A 类·即时报价——中文模板

> 你好,[姓名]!收到你的委托了(工单号 [工单号])。
>
> 根据你选的 [项目类型] × [数量] 和 [预算档/期望档位],我建议按**阅兵标准**报价:**每模型 ¥XX,共 N 件,合计 ¥XX**(含组装、清理、精美地台)。
> 如果要更省:战场标准 ¥XX/件;如果这台想要 NMM/OSL 或场景地台,殿堂典藏 ¥XX 起(看具体复杂度)。
>
> 增值项可选:磁化改造 ¥XX、地形定制、3D 打印补件。
> 周期大约 3~6 周(视队列深度),定金 50%,开工前我会再跟你确认时间。
> 你看这个方案可以吗?可以的话把定金转过来,我排进队列。

### A 类·即时报价——English

> Hi [name], thanks for reaching out (ticket #[ticket])!
>
> Based on [project type] × [count] and your [budget tier], I'd suggest **Parade Ready**: ~[price] per infantry model, total [price] for [N] models (includes assembly, cleaning, and premium basing).
> Or **Battle Ready** at ~[price]/model if you're after tabletop speed, and **Masterpiece** from [price]+ for NMM/OSL or a scenic base — depends on the piece.
> Add-ons available: magnetization, custom terrain, 3D printing.
> Turnaround is usually 3–6 weeks depending on queue depth. A 50% deposit reserves the slot, and I'll confirm the start date with you before I begin.
> Does that work? If so, send the deposit over and I'll get you in the queue.

### B 类·追问模板(一次问完)

**中文:**

> 你好,[姓名]!收到你的委托了(工单号 [工单号]),想跟你确认几个问题,这样报价才准:
> 1. 需要做的是什么?(单个角色 / 5~10 人小队 / 载具 / 场景摆件 / 修复重涂)
> 2. 大概几件?
> 3. 想要的完成度?(上桌快 / 展示级 / 殿堂级)
> 4. 有没有参考图?(配色、姿势、地台风格,微信或邮件发我)
>
> 你回复后我 24 小时内给你正式报价。

**English:**

> Hi [name], got your request (ticket #[ticket])! A few quick questions so I can quote you accurately:
> 1. What's the project? (single character / squad of 5–10 / vehicle / display piece / repaint)
> 2. Roughly how many models?
> 3. What finish are you after? (tabletop / display / showcase)
> 4. Any reference images? (scheme, pose, base style — feel free to attach)
>
> Once you reply I'll get a proper quote to you within 24h.

### C 类:不回复,48h 后关闭工单、取消钉住。

---

## 第四步:定金 → 开工 → 进度 → 交付

| 阶段 | 规则 | 话术要点 |
|------|------|---------|
| **定金 50%** | 报价确认后收 50% 定金才排进队列(`/process/` FAQ 规定) | "定金 ¥XX 到账后我就正式排进队列,预计 [周] 开工" |
| **开工通知** | 定金到账 + 排入队列后发开工通知 | 一句话:确认开工时间、预期完成周、进度更新节点(50%/90% 会发图) |
| **进度更新** | 按 `/process/` 阶段 03:在 **50% 和 90%** 两个里程碑各发一次照片 | 50%:半成品 + 一句"大概完成一半,你看看方向对不对,有问题现在还能改";90%:完工前 + "快好了,最后 [细节] 收尾中" |
| **交付** | 阶段 04:高清摄影(走发布流水线拍照)→ 打包 → 发货(国际件带追踪+保险) | 发单号 + 一句"到货开箱看看,有磕碰随时说" |
| **交付后** | 2 周后跟进一次(复购起点) | "上桌了吗?方便的话发张返图,我可能会发到社媒(会先问你)" |

> **交付 = 内容上新**(衔接发布流水线):交付时拍的高清图 + 360° 视频,**同一份素材**用于 ① 发客户确认 ② 上作品页(`content/work/[slug]/` 按 `.agent/workflows/publishing.md`)③ 进社媒内容池。一次拍摄,三处使用。

---

## 第五步:响应时效承诺(现实值)

| 场景 | 承诺 |
|------|------|
| 表单新委托 → 首次回复 | **24 小时内**(工作日白天可能延到晚上 21:00 集中处理;周末当天) |
| 报价 → 客户追问 | 24 小时内 |
| 定金到账 → 开工通知 | 1~2 个工作日内 |
| 进度更新 | 50% / 90% 里程碑,不另行承诺频率 |

> 为什么定 24h 而不是"实时":丈夫有本职工作,做不到白天秒回。24h 对委托业务是行业可接受值(客户也不是天天在催),而**超了 24h 就是在丢单**——LEAD_SOP 的执行底线。

---

## 以后再做(不在本次范围)

- **Telegram 按钮回调接入**:在 Worker 加 `POST` 路由接收 Telegram `callback_query` webhook,实现 Accept/Decline 更新 D1 `status` 并自动编辑消息。需要:Telegram webhook 配置 + `getUpdates` 或 setWebhook + 一条路由。这是纯代码改动,本次文档任务不做,列为 backlog。
- **表单加"来源"字段**:见 METRICS.md(低成本标注渠道,需改 Worker 一个字段)。
- **自动报价计算器**:根据 rates 三档自动算总价,接入按钮后一按出报价。
