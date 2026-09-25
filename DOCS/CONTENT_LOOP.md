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
| L8 | 关于页「已交付 56」「400+ 档案图片」写死，已与作品数脱节 → 改成模板按作品页自动计算（交付数 = 有 tier 的作品页；图片数 = `photos` 求和） | `layouts/_default/about.html` + `i18n` | 待做 |
| L9 | 关于页自述第三段自贬 + 防砍价语气、「竹子须一节一节地啃」比喻违和（P22：本就是占位稿） | `i18n/zh.toml` `about_bio_3` | 待做 |
| L10 | 审计脚本查不到 i18n 里的「待补充 / TBC」→ 加一条**警告级**检查（不阻断构建，P23 仍在） | `scripts/audit_content.js` | 待做 |
| L11 | 59 篇作品页 `share_caption` 中文是否还有「你」而非「您」、标题/summary 是否有翻译腔 | `content/work/*/index.zh.md` | 待扫 |
| L13 | 构建报 `i18n|MISSING_TRANSLATION|sys_`（某处以空 system 拼 key） | `layouts/` | 待查 |
| L12 | 可扩展点巡检：分类落地页导语、404 文案、图片 alt、单页结构化数据等 | 全站 | 待扫 |

## 待您确认（需要事实或拍板，循环不会替您决定）

- **「两单」口径**：首页/浮层写「每次仅接两单」，关于页写「每季展示位 2」，档期写「2 个展示位开放中」。到底是同时两单还是每季两单？（对应 P6、P9）
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
