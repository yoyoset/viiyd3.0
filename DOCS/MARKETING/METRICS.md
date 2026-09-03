# 衡量与复盘(怎么知道营销有没有用)

> 用途:每 30 分钟一次的复盘,不是 KPI 板。**只用一个已有数据源 + 一个低成本手工记录**——不引入新工具、不装新面板。
> 数据源:① Cloudflare Web Analytics(已埋 beacon,`hugo.toml` 的 `cfBeaconToken` 已配,全站自动统计)② D1 委托表(Worker 已写入,是线索/成交的真账本)。

---

## 一、两个数据源分别看什么

### 1. Cloudflare Web Analytics(看"流量")

登录 `dash.cloudflare.com → Analytics → Web Analytics`,选 viiyd.com:

| 看什么 | 怎么看 | 说明 |
|--------|--------|------|
| **总访问量 & 趋势** | Overview 页按月/周看 | 判断内容有没有带来人;连续 3 个月趋势比单周数值重要 |
| **来源(Top Referrers)** | 按 Referrer 看 | **这里能分辨渠道**:google.com(SEO)、instagram.com(IG 带来的)、t.me(Telegram)、直接访问(老客户/书签)。这是衡量"哪条渠道有用"的第一手证据 |
| **页面停留(Top Pages)** | 按 Page 排序 | 看哪几个作品页最受欢迎 = 用户最想看什么 = 下次内容就往那个方向挖 |
| **跳出/时长** | 单页指标 | 作品页停留长 = 图质量好;停留短 = 图片没吸引力或加载慢(注意图片三级加载架构别破坏) |

> 提醒:Web Analytics 统计的是**网站访问**,不含 IG/公众号站内互动(赞/评论/阅读量)。站内数据在自己平台的创作者后台看,每次发完帖顺手截个图即可,不用记到别处。

### 2. D1 委托表(看"钱")

线索和成交的真账本在 D1 `commissions` 表。查询命令(在 `workers/commission/` 目录):

```powershell
# 本月线索数(状态非垃圾)
npx wrangler d1 execute COMMISSIONS_DB --remote --command="SELECT COUNT(*) AS leads FROM commissions WHERE status != 'VY-SPAM' AND created_at >= strftime('%s','now','-30 days','+8 hours')*1000"
```

```powershell
# 按状态分组(看转化)
npx wrangler d1 execute COMMISSIONS_DB --remote --command="SELECT status, COUNT(*) FROM commissions GROUP BY status"
```

> D1 `created_at` 存的是毫秒时间戳。上面命令是"最近 30 天"(按北京时间近似)。嫌命令麻烦,一个月查一次,把数字抄进复盘模板即可。

---

## 二、委托来源怎么标注(低成本方案)

**现状(事实)**:表单 `POST /api/commission` 只收集 name/contact/project/tier/deadline/notes/reference_urls,**没有来源字段**。Web Analytics 能告诉你"访问来自 IG",但没法告诉你这单委托是 IG 还是公众号带来的——访问和委托之间没有打通。

**低成本做法(不改代码,先跑起来)**:
1. **Telegram 通知消息里人工补一句来源**:收到新委托时,丈夫花 5 秒在钉住消息里加一行 `源: ?`(猜:如果这条是刚发了 IG 帖后进来的,标 `IG`;公众号文章后进来的标 `WX`;搜到网站来的标 `SEO`)。猜错没关系,按月统计趋势够用。
2. **接触时问一句(话术)**:报价沟通时顺带问"你是怎么找到我们的?"——客户多半会说"看到你 IG 的静默王"或"朋友推荐的"。把答案记进钉住消息的 `源:` 行。**这一句的直接效果最好,因为含转介绍**。

**以后再做(建议,需改 Worker + 表单)**:表单加"你怎么找到我们的"下拉(Instagram / 公众号 / 小红书 / 朋友介绍 / 搜索 / 其他),存进 D1 新字段 `source`。这是 30 分钟的小改动,列入 backlog,当前先用手工标注。

---

## 三、每月复盘模板(月底最后一个周末,20 分钟)

复制下面到文档里填空(建议存成 `DOCS/MARKETING/review-YYYYMM.md`):

```markdown
# 复盘 YYYY-MM

## 发了什么(从 CALENDAR 抄)
- IG 正帖: N 条(作品/视频 _ 条,细节/教程 _ 条,日常 _ 条)
- 公众号: _ 篇
- 其他(小红书/X): _ 条

## 流量(Cloudflare Web Analytics)
- 月访问量: _ (上月: _,环比 _)
- Top 来源: 1. _ 2. _ 3. _
- Top 作品页: 1. _ 2. _
- 平均停留: _ 秒

## 线索与成交(D1)
- 线索: _ 条(A类_ / B类_ / C类_)
- 成交(定金): _ 单,金额合计 ¥_
- 来源标注: IG_ / 公众号_ / 搜索_ / 转介绍_ / 未标注_
- 丢单点: _ 条 B 类没跟回 / 响应超 24h _ 次

## 停/增
- 停止(没效果或没时间): _
- 加码(有效果): _
- 下月就做一件事: _
```

---

## 四、最小可行指标集(别做成 KPI 板)

每月只看 6 个数,其他不看:

| # | 指标 | 数据源 | 每月目标(基准) |
|---|------|--------|---------------|
| 1 | IG 正帖数 | 手工计数 | ≥8(每周 2) |
| 2 | 月访问量 | Web Analytics | 稳定或上升(起步期绝对值别焦虑) |
| 3 | 线索数(非垃圾) | D1 `COUNT` | 起步期 1~3/月,稳定后 5+/月 |
| 4 | 成交数(付定金) | D1 status + 手工 | ≥1/月(这是生意,不是流量) |
| 5 | 线索→成交转化 | 3/4 相除 | ≥30% 说明跟进 OK;<30% 查 LEAD_SOP 丢在哪 |
| 6 | 渠道来源 Top1 | Web Analytics Referrer + 手工标注 | 知道就行,连续 3 个月 Top1 的渠道就是你的主战场 |

> **为什么是这 6 个**:全部来自已有数据或 5 秒手工记录;每个都能直接导向"停止还是加码"。不要追求"每渠道 ROI""粉丝增长曲线"这类需要大量统计的东西——**对两个人工匠来说,6 个数能坚持看下去,胜过 20 个数看一个月就放弃。**
