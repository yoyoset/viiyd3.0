# 分享文案标准

> 每单一份 `share_caption`，人写，不是自动拼字段。这份文档定的是「怎么写」，
> 不是「怎么生成」——机制见 `layouts/work/single.html` 的分享区块 +
> `layouts/partials/share-panel.html` + `assets/js/share.js`；标签怎么机械
> 推导见 `data/social.yaml`。

## 字段放哪

- `share_caption`（写在 `index.zh.md`）→ 小红书正文来源，朋友圈直接复用（去掉标签）。
- `share_caption`（写在 `index.md`）→ Instagram 正文来源，Facebook 直接复用（去掉标签）。
- 纯正文，**不要**在里面手打话题标签或链接——标签由模板从 `tags:`/`system:` 机械拼，
  链接由模板自动追加 `.Permalink`。写标签/链接等于以后改一次要维护两处。
- 只有可选的 `share_tags` 用于覆盖机械推导（目前只有 4 篇 3.0 遗留作品用得上，
  新作品不需要）。

## 语气基调

跟 `i18n/zh.toml` 关于页/服务页同一个人设：**随和、慵懒、脾气好、不拒绝**。
`.agent/rules/WRITING_STYLE.md` 第 2/3 节那套 "Imperial / Professional, Sharp,
Military" 调性已废弃，`content/work/*/social_media.md` 那两篇死文件是反面教材，
不要模仿——第一人称可以，但不是端着的"精准就是一切"这种口吻，是发朋友圈那种
随口一说的分享感。

## 结构（不是模板，是检查清单）

一份 `share_caption` 通常 4-6 句，收个尾但不写死格式：

1. **一个钩子**——从 `private/MARKETING_PLAYBOOK.md` 的 H1/H2/H4/H6 里挑一个
   贴这一单实际情况的：工时反差（H1，`time_log` 现成）、灰模到成品的悬念
   （H2）、身份代入（H4，"如果这是你的桌面"）、数字清单（H6，用了几种颜色/
   几层罩染）。不必每次都用同一个，同一个用多了读者会腻。
2. **2-3 句具体细节**——从这一单的 `summary`/`paints`/`model_count` 取材，
   写清楚这一单在做什么、难在哪、我在意哪个细节。避免空泛的"精美绝伦"，
   写得出来的细节才有说服力。
3. **一句真实感受或小遗憾**（可选但推荐）——参考 `.agent/workflows/publishing.md`
   §6.1 的 Anti-Robot 规则：留一处真实不足，比堆砌形容词更可信。
4. **一句软 CTA**——不写死，可以是"喜欢的话来聊聊你的"，也可以什么都不加
   （标签+链接已经在文案后面自动跟着）。**不写命令式**（"立刻联系""不要错过"）。

## 禁用词表

沿用 `.agent/workflows/publishing.md` §6.1 + `DOCS/SOCIAL_MEDIA_STRATEGY.md`：
- 英文：`Dive into` `Unleash` `Game changer` `In today's world` `Precision is
  everything`（旧文件里的开场白，废弃）
- 中文：`绝绝子` `家人们` `无语子`，以及任何"这个不接/那个不做"式的拒绝句——
  跟网站正文的调性冲突（参考本次改版对关于页 `about_bio_2/3` 的处理）。

## 标签与链接（机械部分，不用手写）

- `data/social.yaml` 存常青标签池 + 按 `system` 分类的标签。
- 模板从该单 `tags:` 数组里剔除泛词（"Warhammer 40,000"/"Commission"/"战锤"/
  "委托"这类），把剩下的专有名词（阵营、单位名）slugify 后拼进去。
- 新增/调整常青标签，改 `data/social.yaml` 一处即可，不用回头改 56 篇作品。

## 新作品发布时怎么接进来

`.agent/workflows/publishing.md` 第 3 节（内容创建）走完之后，照这份标准给
`index.md`/`index.zh.md` 各加一行 `share_caption`，构建后到该作品页顶部/底部
点开分享面板确认四个渠道都出来了。没有第五步——不需要额外建 `social_media.md`，
那个模式已经证明会变成没人读的死文件。
