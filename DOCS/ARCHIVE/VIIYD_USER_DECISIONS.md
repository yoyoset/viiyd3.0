# VIIYD 营销策略 - 用户决策文档
# Strategic Decisions for Human Review

> 此文档包含需要**您亲自决策**的内容，无法由AI自动执行

---

## 🔌 联络接入方式选择

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **弹窗 Contact Modal** | 简单快速、无需后端 | 仅跳转邮件客户端 | ⭐⭐⭐ |
| **Cloudflare Worker** | 无服务器、免费额度高、可存储数据 | 需要编写代码 | ⭐⭐⭐⭐ |
| **Formspree** | 开箱即用、免费50次/月 | 免费版有限制 | ⭐⭐⭐⭐ |
| **Tally Forms** | 完全免费、漂亮UI | 第三方依赖 | ⭐⭐⭐⭐⭐ |

### 💡 我的建议

**推荐方案：Tally Forms 或 Cloudflare Worker**

1. **快速上线** → 用 [Tally.so](https://tally.so) (免费无限表单)
2. **长期方案** → Cloudflare Worker + D1 数据库存储询价

```
用户行为流程:
点击CTA按钮 → 弹出联络Modal → 填写表单 → 邮件通知您
```

### ❓ 需要您决定

1. 是否需要保存询价记录到数据库？
2. 是否需要自动回复功能？
3. 表单需要哪些字段？（姓名、邮箱、项目类型、预算、描述？）

---

## 📤 自动分享功能分析

### Instagram 自动发布

> ⚠️ **Instagram 不支持个人账号自动发布**

Instagram 只对商业账号/创作者账号开放 API，且不支持直接 feed 图片发布。

**替代方案：**

| 工具 | 功能 | 价格 |
|------|------|------|
| **Buffer** | 排期发布、多平台 | 免费3个频道 |
| **Later** | 可视化排期、最佳时间建议 | 免费有限功能 |
| **Hootsuite** | 企业级、分析功能强 | 付费 |
| **Meta Business Suite** | 官方工具、免费 | 仅商业账号 |

### 可自动发布的平台

| 平台 | 自动发布 | 接入方式 |
|------|----------|----------|
| **Twitter/X** | ✅ 支持 | API / IFTTT / Zapier |
| **Pinterest** | ✅ 支持 | RSS / Tailwind |
| **Tumblr** | ✅ 支持 | IFTTT |
| **Telegram** | ✅ 支持 | Bot API |
| **Discord** | ✅ 支持 | Webhook |
| **小红书** | ❌ 不支持 | 手动发布 |
| **Instagram** | ⚠️ 受限 | 需商业账号+排期工具 |
| **Bilibili** | ❌ 不支持 | 手动发布 |

### 💡 推荐自动化流程

```
新作品发布 (Hugo)
    ↓
生成 RSS Feed
    ↓
IFTTT/Zapier 监听 RSS
    ↓
自动发布到 Twitter/Pinterest/Telegram
    ↓
通知您手动发布到 Instagram/小红书
```

### ❓ 需要您决定

1. 是否升级 Instagram 为商业账号？
2. 是否开通 Twitter/Pinterest 账号用于自动分享？
3. 是否需要 Telegram 频道通知？

---

## 📋 需要您手动处理的事项

这些无法由 AI 自动完成：

1. **账号注册**
   - [ ] 小红书账号注册/认证
   - [ ] B站账号注册/认证
   - [ ] Buffer/Later 账号注册
   - [ ] Instagram 升级商业账号（如需要）

2. **内容创作**
   - [ ] 拍摄涂装过程视频
   - [ ] 撰写社交媒体文案
   - [ ] 定期发布和互动

3. **商务合作**
   - [ ] 联系战锤店铺洽谈合作
   - [ ] 联系 Up主/KOL 洽谈推广

4. **付费投放**
   - [ ] 设置 Google Ads 账户
   - [ ] 配置 Meta 广告账户
   - [ ] 制定广告预算

---

## 📞 联系方式确认

- ✅ **Email**: `maylyy8@gmail.com` (已确认)
- ✅ **Instagram**: [@viiyang.yingying](https://www.instagram.com/viiyang.yingying/)
- ✅ **微信二维码**: `/static/img/mywechat.jpg`

---

*请在做出决策后告知我，我将更新执行文档*
