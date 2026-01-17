# Work文章完整修复计划

**创建日期**: 2026-01-17  
**目标**: 修复所有work文章，解决Hugo渲染错误  
**执行者**: 下一个Agent

---

## 🚨 当前问题

Hugo报错：
```
Failed to render "/zh/": render: failed to render pages: render of "/" failed at <.Summary>: error calling Summary: runtime error: slice bounds out of range [:6932] with capacity 6912
```

**根本原因**: 之前使用PowerShell批处理时破坏了22个.zh.md文件的UTF-8编码。

---

## 📁 需要处理的文件

### 项目列表（26个项目，52个文件）

| # | 项目文件夹 | index.md | index.zh.md |
|---|-----------|----------|-------------|
| 1 | 3d-print-custom-figure-chromatic | ✅ 已修复 | ✅ 已修复 |
| 2 | black-myth-wukong-chibi | ✅ 已修复 | ⚠️ 需验证 |
| 3 | blue-horrors-tzeentch-chaos-daemons | ⏸️ 待处理 | ❌ 编码破坏 |
| 4 | cities-of-sigmar-army-showcase-complete-set | ⏸️ 待处理 | ❌ 编码破坏 |
| 5 | dark-angels-deathwing | ⏸️ 待处理 | ❌ 编码破坏 |
| 6 | dark-angels-interemptors-dreadwing | ⏸️ 待处理 | ❌ 编码破坏 |
| 7 | flesh-hounds-khorne-daemons-showcase | ⏸️ 待处理 | ❌ 编码破坏 |
| 8 | freeguild-cavalier-marshal-and-ironweld-great-cannon | ⏸️ 待处理 | ❌ 编码破坏 |
| 9 | freeguild-cavaliers-cities-of-sigmar-blue-scheme | ⏸️ 待处理 | ❌ 编码破坏 |
| 10 | freeguild-cavaliers-cities-of-sigmar-red-scheme | ⏸️ 待处理 | ❌ 编码破坏 |
| 11 | hexbanes-hunters-underworlds-witch-hunters | ⏸️ 待处理 | ❌ 编码破坏 |
| 12 | joytoy-dark-source-steel-legion-head-repaint | ⏸️ 待处理 | ❌ 编码破坏 |
| 13 | kill-team-blood-and-zeal-sanctifiers | ⏸️ 待处理 | ❌ 编码破坏 |
| 14 | kill-team-kasrkin | ⏸️ 待处理 | ❌ 编码破坏 |
| 15 | legio-custodes-caladius-grav-tank-annihilator | ⏸️ 待处理 | ❌ 编码破坏 |
| 16 | lion-el-jonson | ⏸️ 待处理 | ❌ 编码破坏 |
| 17 | lion-el-jonson-fanmade-custom | ⏸️ 待处理 | ❌ 编码破坏 |
| 18 | noise-marines-slaanesh-chaos-space-marines | ⏸️ 待处理 | ❌ 编码破坏 |
| 19 | pink-horrors-tzeentch-chaos-daemons | ⏸️ 待处理 | ❌ 编码破坏 |
| 20 | plague-marines-death-guard-nurgle | ⏸️ 待处理 | ❌ 编码破坏 |
| 21 | screamers-of-tzeentch-chaos-daemons | ⏸️ 待处理 | ❌ 编码破坏 |
| 22 | tahlia-vedra-lioness-of-the-parch | ⏸️ 待处理 | ❌ 编码破坏 |
| 23 | warhammer-painting-beginner-guide | ⏸️ 待处理 | ❌ 编码破坏 |
| 24 | wildercorps-hunters-cities-of-sigmar | ⏸️ 待处理 | ❌ 编码破坏 |
| 25 | wuxia-board-game-miniature-painting-test | ⏸️ 待处理 | ❌ 编码破坏 |
| 26 | zenestra-matriarch-of-the-great-wheel-cities-of-sigmar | ⏸️ 待处理 | ❌ 编码破坏 |

---

## 📋 执行步骤

### 逐一修复流程

**对于每个项目，按以下步骤处理**:

#### 步骤1: 检查英文版 index.md
1. 使用 `view_file` 查看完整内容
2. 检查frontmatter是否完整（参考下方规范）
3. 检查HTML标签是否flush left（无缩进）
4. 如有问题，使用 `replace_file_content` 或 `write_to_file` 修复

#### 步骤2: 重建中文版 index.zh.md
1. 基于英文版内容
2. 使用 `write_to_file` 创建新的中文文件
3. 翻译以下内容：
   - title
   - summary
   - tags
   - description
   - lightbox的title属性
   - Hook部分文案
   - Technical Cards标题和内容
   - CTA文案

#### 步骤3: 验证
1. 检查Hugo是否报错
2. 如果报错，检查具体问题并修复
3. 完成后继续下一个项目

---

## 📏 项目处理顺序（按字母顺序）

1. 3d-print-custom-figure-chromatic ✅ 已完成
2. black-myth-wukong-chibi ⚠️ 需验证
3. blue-horrors-tzeentch-chaos-daemons
4. cities-of-sigmar-army-showcase-complete-set
5. dark-angels-deathwing
6. dark-angels-interemptors-dreadwing
7. flesh-hounds-khorne-daemons-showcase
8. freeguild-cavalier-marshal-and-ironweld-great-cannon
9. freeguild-cavaliers-cities-of-sigmar-blue-scheme
10. freeguild-cavaliers-cities-of-sigmar-red-scheme
11. hexbanes-hunters-underworlds-witch-hunters
12. joytoy-dark-source-steel-legion-head-repaint
13. kill-team-blood-and-zeal-sanctifiers
14. kill-team-kasrkin
15. legio-custodes-caladius-grav-tank-annihilator
16. lion-el-jonson
17. lion-el-jonson-fanmade-custom
18. noise-marines-slaanesh-chaos-space-marines
19. pink-horrors-tzeentch-chaos-daemons
20. plague-marines-death-guard-nurgle
21. screamers-of-tzeentch-chaos-daemons  
22. tahlia-vedra-lioness-of-the-parch
23. warhammer-painting-beginner-guide
24. wildercorps-hunters-cities-of-sigmar
25. wuxia-board-game-miniature-painting-test
26. zenestra-matriarch-of-the-great-wheel-cities-of-sigmar

**内容结构**:
```markdown
<div class="image-grid">
{{< lightbox src="[URL]" title="[中文标题]" >}}
[复制所有lightbox，翻译title]
</div>

<div class="space-y-4 my-4">

<!-- THE HOOK -->
<div class="bg-gradient-to-r from-neutral-800 to-transparent border-l-4 border-gold-500 p-6 rounded-r-lg">
<h3 class="text-xl font-bold text-white mb-2">🔥 作战定位: [中文定位]</h3>
<p class="text-gray-300 leading-relaxed">
[中文描述文案]
</p>
</div>

<!-- ⚠️ 不要添加Stats Bar - 由模板自动生成 -->

<!-- TECHNICAL CARDS -->
<div class="grid md:grid-cols-2 gap-4">

<!-- Card 1: 调色配方 -->
<div class="bg-neutral-800/30 p-5 rounded border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
<div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
<h4 class="font-bold text-emerald-400 flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
调色配方
</h4>
<span class="text-[10px] uppercase text-gray-500">色彩数据</span>
</div>
<ul class="space-y-3 text-sm text-gray-300">
[根据英文版翻译配方列表]
</ul>
</div>

<!-- Card 2: 战术规程 -->
<div class="bg-neutral-800/30 p-5 rounded border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
<div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
<h4 class="font-bold text-cyan-400 flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
战术规程
</h4>
<span class="text-[10px] uppercase text-gray-500">技法解析</span>
</div>
<p class="text-sm text-gray-400 mb-2">部署的技法：</p>
<ul class="space-y-2 text-sm text-gray-300 list-disc list-inside marker:text-cyan-500">
[根据英文版翻译技法列表]
</ul>
</div>

</div>

<!-- BOTTOM CTA -->
<div class="bg-gradient-to-r from-purple-900/20 via-neutral-900 to-neutral-900 p-6 rounded border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-neutral-800 transition-all cursor-pointer group" onclick="window.location='/rates'">
<div>
<h4 class="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">准备好部署了吗？</h4>
<p class="text-sm text-gray-400">[中文CTA描述]</p>
</div>
<button class="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all transform group-hover:-translate-y-0.5 whitespace-nowrap">
启动委托程序 ->
</button>
</div>

</div>
```

#### 步骤2.3: 验证修复
```powershell
hugo server -p 1314
```
访问 http://localhost:1314/zh/work/[项目名]/ 确认显示正常

---

### 阶段3: 修复英文版.md文件

**对于每个英文文件，检查并修复**:

#### 检查项:

1. **Frontmatter完整性**
   - [ ] title - 必需
   - [ ] date - 必需，格式YYYY-MM-DD
   - [ ] summary - 必需
   - [ ] tags - 必需，数组格式
   - [ ] cover - 必需，完整URL
   - [ ] layout - 必需，值为"project"
   - [ ] tier - 必需，选项: Battleline/Specialist/Spec Ops/Master/Legend
   - [ ] time_log - 必需，格式"XXh XXm"
   - [ ] model_count - 可选，默认1
   - [ ] paints - 必需，数组格式，每项有name/role/hex/link
   - [ ] description - 必需

2. **Paints数组格式**
   ```yaml
   paints:
     - name: "Paint Name"
       role: "BASE"  # BASE/LAYER/SHADE/HIGHLIGHT/METALLIC/CONTRAST
       hex: "#XXXXXX"
       link: "https://..."
   ```
   - [ ] 每个paint有4个字段
   - [ ] 包含所有实际使用的颜色（无数量限制）

3. **HTML标签格式**
   - [ ] 所有HTML标签flush left（无缩进）
   - [ ] 没有手动Stats Bar代码块

4. **内容完整性**
   - [ ] Gallery Grid存在
   - [ ] THE HOOK部分存在
   - [ ] Technical Cards存在
   - [ ] Bottom CTA存在

---

## 📏 标准参考文件

### 关键文件位置

| 文件 | 路径 | 用途 |
|------|------|------|
| 模板标准 | `f:\mysite\viiyd3.0\DOCS\WORK_TEMPLATE.md` | Frontmatter和内容结构标准 |
| 内容标准 | `f:\mysite\viiyd3.0\DOCS\WORK_CONTENT_STANDARDS.md` | 完整规范文档 |
| Hugo模板 | `f:\mysite\viiyd3.0\layouts\_default\single.html` | 了解自动生成的内容 |
| i18n | `f:\mysite\viiyd3.0\i18n\zh.toml` | 中文翻译键值 |
| 已修复示例 | `f:\mysite\viiyd3.0\content\work\3d-print-custom-figure-chromatic\` | 参考正确格式 |

### Tier颜色对照

| Tier | 颜色类 | 显示效果 |
|------|--------|----------|
| Battleline | text-blue-400 | 蓝色 |
| Specialist | text-green-400 | 绿色 |
| Spec Ops | text-purple-400 | 紫色 |
| Master | text-orange-400 | 橙色 |
| Legend | text-gold-400 | 金色 |

### 标题翻译参考

| 英文 | 中文 |
|------|------|
| Front View | 正面视图 |
| Back View | 背面视图 |
| Side View | 侧面视图 |
| Detail | 细节 |
| Group Shot | 集体照 |
| Final Showcase | 最终展示 |
| Armor Detail | 护甲细节 |
| Weapon Detail | 武器细节 |
| Base Detail | 底座细节 |
| Face Detail | 面部细节 |
| The Alchemy | 调色配方 |
| Tactical Protocol | 战术规程 |

---

## ⚠️ 重要注意事项

### ❌ 绝对不要做的事

1. **不要使用PowerShell批量处理UTF-8文件** - 这是导致当前问题的根本原因
2. **不要在Markdown中手动添加Stats Bar** - 由single.html自动生成
3. **不要给HTML标签添加缩进** - 必须flush left
4. **不要使用简化的paints格式** - 必须有name/role/hex/link四个字段

### ✅ 必须做的事

1. **使用write_to_file工具创建/替换文件** - 确保UTF-8编码正确
2. **每修复一个文件后立即验证** - 运行hugo server检查
3. **参考已修复的示例文件** - 3d-print-custom-figure-chromatic
4. **保持frontmatter字段完整** - 缺失字段会导致渲染问题

---

## 🔄 执行顺序建议

### 第一批（紧急 - 解决Hugo报错）
1. 诊断哪个文件导致报错
2. 删除或替换该文件
3. 验证Hugo可以正常运行

### 第二批（高优先级 - 恢复基本功能）
- blue-horrors-tzeentch-chaos-daemons
- cities-of-sigmar-army-showcase-complete-set
- dark-angels-deathwing
- dark-angels-interemptors-dreadwing
- flesh-hounds-khorne-daemons-showcase

### 第三批（中优先级）
- freeguild-cavalier-marshal-and-ironweld-great-cannon
- freeguild-cavaliers-cities-of-sigmar-blue-scheme
- freeguild-cavaliers-cities-of-sigmar-red-scheme
- hexbanes-hunters-underworlds-witch-hunters
- joytoy-dark-source-steel-legion-head-repaint

### 第四批
- kill-team-blood-and-zeal-sanctifiers
- kill-team-kasrkin
- legio-custodes-caladius-grav-tank-annihilator
- lion-el-jonson
- lion-el-jonson-fanmade-custom

### 第五批
- noise-marines-slaanesh-chaos-space-marines
- pink-horrors-tzeentch-chaos-daemons
- plague-marines-death-guard-nurgle
- screamers-of-tzeentch-chaos-daemons
- tahlia-vedra-lioness-of-the-parch

### 第六批（最后）
- warhammer-painting-beginner-guide
- wildercorps-hunters-cities-of-sigmar
- wuxia-board-game-miniature-painting-test
- zenestra-matriarch-of-the-great-wheel-cities-of-sigmar
- black-myth-wukong-chibi (验证)

---

## ✅ 验证检查清单

每个文件修复后，验证以下项目：

### Hugo构建验证
```powershell
hugo server -p 1314
```
- [ ] 无报错启动
- [ ] 英文页面可访问: http://localhost:1314/work/[项目名]/
- [ ] 中文页面可访问: http://localhost:1314/zh/work/[项目名]/

### 页面内容验证
- [ ] Hero Image正确显示
- [ ] 左侧Mission Data Card正确显示
  - [ ] Tier显示正确颜色
  - [ ] Time Log显示
  - [ ] Paints色块全部显示（无遗漏）
- [ ] Stats Bar只显示一次（不重复）
- [ ] Gallery图片全部加载
- [ ] THE HOOK内容正确
- [ ] Technical Cards显示
- [ ] CTA按钮可点击

---

## 📝 进度记录模板

修复每个项目后，记录进度：

```
## [项目名]
- 开始时间: YYYY-MM-DD HH:MM
- index.md状态: [已检查/已修复/无需修改]
- index.zh.md状态: [已重建/已修复]
- 验证结果: [通过/失败-原因]
- 完成时间: YYYY-MM-DD HH:MM
```

---

**计划结束 - 请下一个Agent按此执行**
