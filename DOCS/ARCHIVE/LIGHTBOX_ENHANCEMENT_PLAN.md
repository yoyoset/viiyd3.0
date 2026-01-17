# Lightbox Enhancement Plan v2

> **目标**: 为自定义灯箱添加 **分享**、**保存图片**、**1:1 放大拖拽查看**、**完善移动端导航** 功能
> **执行者**: Gemini 3 Agent
> **主文件**: `assets/js/lightbox.js`
> **版本**: 2.0

---

## 一、现状分析

### 1.1 当前功能
| 功能 | PC | 移动端 | 备注 |
|------|-----|--------|------|
| 点击图片打开灯箱 | ✅ | ✅ | |
| 左右箭头导航 | ✅ | ❌ | `hidden md:block` 隐藏 |
| 键盘导航 (Esc/←/→) | ✅ | N/A | 移动端无物理键盘 |
| 手势滑动导航 | N/A | ✅ | touchstart/touchend |
| 点击背景关闭 | ✅ | ✅ | |

### 1.2 当前代码结构
```javascript
// lightbox.js (119 lines)
- DOM 创建: lightbox, imgContainer, closeBtn, prevBtn, nextBtn
- 导航: showImage(index), closeLightbox()
- 事件: click, keydown, touchstart/touchend
```

### 1.3 已知问题
| 问题 | 影响 |
|------|------|
| 移动端无箭头导航 | 用户只能依赖滑动，不直观 |
| 无图片计数器 | 用户不知道当前位置 |
| 无保存/分享功能 | 用户需手动长按 |
| 无 1:1 缩放 | 无法查看高清细节 |

---

## 二、需求规格

### 2.1 移动端导航增强

#### 问题分析
当前代码：
```javascript
prevBtn.className = '... hidden md:block ...'; // 移动端隐藏
nextBtn.className = '... hidden md:block ...'; // 移动端隐藏
```

#### 解决方案：三种导航方式共存

| 导航方式 | PC | 移动端 | 触发条件 |
|----------|-----|--------|----------|
| 箭头按钮 | ✅ 两侧显示 | ✅ 工具栏显示 | 点击按钮 |
| 键盘 | ✅ ←/→/Esc | N/A | keydown |
| 手势滑动 | N/A | ✅ | touchstart + touchend |
| 点击区域 | ✅ 左右 1/3 | ✅ 左右 1/3 | click (排除工具栏/图片) |

#### 实现要点

**1. 移动端箭头按钮移入工具栏**
```javascript
// 移动端检测
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// 工具栏布局 (移动端)
// [◀] [分享] [保存] [缩放] [1/10] [▶] [❌]
```

**2. 点击区域导航 (PC + 移动端)**
```javascript
lightbox.addEventListener('click', (e) => {
  // 排除工具栏点击
  if (e.target.closest('.toolbar')) return;
  // 排除图片点击 (用于缩放)
  if (e.target === imgContainer) return;
  
  const rect = lightbox.getBoundingClientRect();
  const x = e.clientX;
  const leftThreshold = rect.width * 0.33;
  const rightThreshold = rect.width * 0.67;
  
  if (x < leftThreshold) {
    showImage(currentIndex - 1);
  } else if (x > rightThreshold) {
    showImage(currentIndex + 1);
  } else {
    closeLightbox(); // 中间区域关闭
  }
});
```

**3. 手势滑动优化**
```javascript
// 防止与 1:1 模式下的拖拽冲突
function handleSwipe() {
  if (isZoomed) return; // 放大模式下禁用滑动导航
  
  const threshold = 50;
  if (touchEndX < touchStartX - threshold) {
    showImage(currentIndex + 1); // 左滑 → 下一张
  }
  if (touchEndX > touchStartX + threshold) {
    showImage(currentIndex - 1); // 右滑 → 上一张
  }
}
```

---

### 2.2 分享功能 (Share)

#### 行为定义
1. 点击分享按钮
2. 优先调用 Web Share API (`navigator.share`)
3. 若不支持，复制图片 URL 到剪贴板 + Toast

#### 实现代码
```javascript
async function handleShare() {
  const imgSrc = imgContainer.src;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'VIIYD Artwork',
        text: '精致微缩涂装作品',
        url: imgSrc,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyToClipboard(imgSrc);
      }
    }
  } else {
    copyToClipboard(imgSrc);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('链接已复制'))
    .catch(() => showToast('复制失败'));
}
```

---

### 2.3 保存图片功能 (Save/Download)

#### 平台策略

| 平台 | 策略 | 技术方案 |
|------|------|----------|
| PC | 直接下载 | Fetch → Blob → download |
| iOS Safari 15+ | 分享菜单保存 | `navigator.share({ files })` |
| Android | 分享菜单保存 | `navigator.share({ files })` |
| 老设备 Fallback | 提示长按 | Toast + 新窗口 |

#### 实现代码

```javascript
async function handleSave() {
  const imgSrc = imgContainer.src;
  
  try {
    const response = await fetch(imgSrc);
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    
    if (isMobile && navigator.canShare) {
      // 移动端: Web Share Files API
      const file = new File([blob], 'viiyd-artwork.jpg', { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'VIIYD Artwork' });
        return;
      }
    }
    
    // PC 或 Fallback: 直接下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viiyd-artwork-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('图片已保存');
    
  } catch (err) {
    // 最终 Fallback: 新窗口打开
    window.open(imgSrc, '_blank');
    showToast('请长按图片保存');
  }
}
```

> [!WARNING]
> **CORS 依赖**: `photo.viiyd.com` 必须返回 `Access-Control-Allow-Origin: *`

---

### 2.4 1:1 放大拖拽查看 (Zoom & Pan)

#### 状态机
```
┌─────────┐  点击缩放按钮/双击  ┌─────────┐
│  FIT    │ ────────────────→ │   1:1   │
│         │ ←──────────────── │         │
└─────────┘  点击缩放按钮/双击  └─────────┘
```

#### 行为定义

| 状态 | 图片尺寸 | 光标 | 拖拽 | 滑动导航 | 点击图片 |
|------|----------|------|------|----------|----------|
| FIT | max 90vh/90vw | zoom-in | 禁用 | 启用 | 放大 |
| 1:1 | 原始尺寸 | grab/grabbing | 启用 | 禁用 | 缩小 |

#### 实现代码

```javascript
let isZoomed = false;
let panX = 0, panY = 0;
let isDragging = false;
let startX, startY, startPanX, startPanY;

function toggleZoom() {
  isZoomed = !isZoomed;
  
  if (isZoomed) {
    imgContainer.style.maxWidth = 'none';
    imgContainer.style.maxHeight = 'none';
    imgContainer.style.cursor = 'grab';
    imgContainer.style.touchAction = 'none'; // 禁用浏览器默认手势
  } else {
    imgContainer.style.maxWidth = '90vw';
    imgContainer.style.maxHeight = '90vh';
    imgContainer.style.cursor = 'zoom-in';
    imgContainer.style.touchAction = 'auto';
    resetPan();
  }
  
  updateZoomButtonIcon();
}

function resetPan() {
  panX = 0;
  panY = 0;
  imgContainer.style.transform = 'translate(0, 0)';
}

// 拖拽逻辑
function startDrag(e) {
  if (!isZoomed) return;
  isDragging = true;
  imgContainer.style.cursor = 'grabbing';
  
  const pos = getEventPos(e);
  startX = pos.x;
  startY = pos.y;
  startPanX = panX;
  startPanY = panY;
  
  e.preventDefault(); // 防止选中文字
}

function onDrag(e) {
  if (!isDragging) return;
  
  const pos = getEventPos(e);
  panX = startPanX + (pos.x - startX);
  panY = startPanY + (pos.y - startY);
  
  // 边界约束
  const bounds = calculateBounds();
  panX = Math.min(bounds.maxX, Math.max(bounds.minX, panX));
  panY = Math.min(bounds.maxY, Math.max(bounds.minY, panY));
  
  imgContainer.style.transform = `translate(${panX}px, ${panY}px)`;
}

function endDrag() {
  isDragging = false;
  imgContainer.style.cursor = 'grab';
}

function getEventPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function calculateBounds() {
  const imgRect = imgContainer.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  
  // 允许图片边缘到达视口边缘，但不能超出太多
  const overflowX = Math.max(0, imgRect.width - viewportW) / 2;
  const overflowY = Math.max(0, imgRect.height - viewportH) / 2;
  
  return {
    minX: -overflowX,
    maxX: overflowX,
    minY: -overflowY,
    maxY: overflowY,
  };
}
```

#### 双击切换
```javascript
let lastTapTime = 0;

imgContainer.addEventListener('click', (e) => {
  const now = Date.now();
  if (now - lastTapTime < 300) {
    // 双击
    toggleZoom();
    e.stopPropagation();
  }
  lastTapTime = now;
});
```

---

## 三、UI 设计

### 3.1 响应式布局

#### PC 布局
```
┌────────────────────────────────────────────────────────────┐
│ [❌]                                                       │  ← 右上角关闭
│                                                            │
│  [◀]              [ 图片内容 ]                       [▶]  │  ← 两侧箭头
│                                                            │
├────────────────────────────────────────────────────────────┤
│        [分享] [保存] [缩放] [1/10]                         │  ← 底部工具栏
└────────────────────────────────────────────────────────────┘
```

#### 移动端布局
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    [ 图片内容 ]                            │  ← 左右滑动导航
│                                                            │
├────────────────────────────────────────────────────────────┤
│  [◀] [分享] [保存] [缩放] [1/10] [▶] [❌]                  │  ← 工具栏含箭头
└────────────────────────────────────────────────────────────┘
```

### 3.2 工具栏 HTML

```html
<!-- 工具栏 -->
<div class="toolbar absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
  <div class="flex items-center justify-center gap-4 md:gap-6">
    
    <!-- 上一张 (移动端显示) -->
    <button class="toolbar-btn md:hidden" id="prev-mobile">
      <svg><!-- chevron-left --></svg>
    </button>
    
    <!-- 分享 -->
    <button class="toolbar-btn" id="share-btn" title="分享">
      <svg><!-- share icon --></svg>
    </button>
    
    <!-- 保存 -->
    <button class="toolbar-btn" id="save-btn" title="保存">
      <svg><!-- download icon --></svg>
    </button>
    
    <!-- 缩放 -->
    <button class="toolbar-btn" id="zoom-btn" title="放大/缩小">
      <svg id="zoom-icon"><!-- zoom icon --></svg>
    </button>
    
    <!-- 计数器 -->
    <span class="text-white/70 text-sm font-mono" id="counter">1/10</span>
    
    <!-- 下一张 (移动端显示) -->
    <button class="toolbar-btn md:hidden" id="next-mobile">
      <svg><!-- chevron-right --></svg>
    </button>
    
    <!-- 关闭 (移动端显示在工具栏) -->
    <button class="toolbar-btn md:hidden" id="close-mobile">
      <svg><!-- x icon --></svg>
    </button>
    
  </div>
</div>

<!-- PC 箭头 (两侧固定) -->
<button class="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 nav-btn" id="prev-btn">
  <svg><!-- chevron-left --></svg>
</button>
<button class="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 nav-btn" id="next-btn">
  <svg><!-- chevron-right --></svg>
</button>

<!-- PC 关闭 (右上角) -->
<button class="hidden md:flex absolute top-4 right-4 close-btn" id="close-btn">
  <svg><!-- x icon --></svg>
</button>
```

### 3.3 Toast 组件

```javascript
function showToast(message, duration = 2000) {
  const existing = document.getElementById('v-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'v-toast';
  toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 text-white text-sm rounded-full z-[70] transition-opacity duration-300';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
```

---

## 四、实施步骤

### Phase 0: 代码备份
1. [ ] 备份 `assets/js/lightbox.js` 到 `backup/`

### Phase 1: 重构 UI 结构 (预计 30min)
1. [ ] 创建响应式工具栏容器
2. [ ] PC: 保持两侧箭头 + 右上角关闭
3. [ ] 移动端: 工具栏内箭头 + 关闭
4. [ ] 添加计数器

### Phase 2: 完善导航逻辑 (预计 20min)
1. [ ] 保持现有滑动导航
2. [ ] 添加点击区域导航 (左/中/右)
3. [ ] 更新计数器显示
4. [ ] 确保循环导航 (第一张←→最后一张)

### Phase 3: 实现分享功能 (预计 20min)
1. [ ] 实现 `handleShare()` 函数
2. [ ] 实现 `copyToClipboard()` 函数
3. [ ] 添加 Toast 组件

### Phase 4: 实现保存功能 (预计 30min)
1. [ ] 实现 `handleSave()` 函数
2. [ ] PC: Fetch + Blob + download
3. [ ] 移动端: Web Share Files API
4. [ ] Fallback: 新窗口 + Toast

### Phase 5: 实现 1:1 缩放 (预计 45min)
1. [ ] 添加状态变量 (isZoomed, panX, panY, isDragging)
2. [ ] 实现 `toggleZoom()` 函数
3. [ ] 实现拖拽逻辑 (Mouse + Touch)
4. [ ] 实现边界约束 `calculateBounds()`
5. [ ] 实现双击切换
6. [ ] 放大模式下禁用滑动导航

### Phase 6: 测试与验证 (预计 30min)
1. [ ] PC Chrome 测试所有功能
2. [ ] PC Firefox 测试
3. [ ] iOS Safari 真机测试
4. [ ] Android Chrome 测试
5. [ ] CORS 跨域测试 (photo.viiyd.com)
6. [ ] 边界情况: 单张图片、超大图片、小于视口图片

---

## 五、文件变更清单

| 文件 | 操作 | 预计行数变化 |
|------|------|--------------|
| `assets/js/lightbox.js` | MODIFY | +200~250 行 |
| `assets/css/main.css` | MODIFY | +20~30 行 (工具栏样式) |

---

## 六、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| CORS 阻止 fetch | 中 | 保存失败 | Fallback: 新窗口 + 长按提示 |
| Web Share API 不支持 | 低 | 保存降级 | Fallback: 长按提示 |
| 双击与单击冲突 | 中 | 误触发 | 300ms 延迟判断 |
| 拖拽与滑动冲突 | 高 | 误操作 | isZoomed 状态隔离 |
| 移动端 touch-action | 中 | 浏览器抢占手势 | CSS touch-action: none |
| 超大图片内存 | 低 | 卡顿 | 暂不处理，观察实际情况 |

---

## 七、验收标准

### 功能验收
- [ ] **导航**: PC 箭头 + 移动端工具栏箭头 + 滑动 + 点击区域
- [ ] **计数器**: 显示当前/总数 (X/Y)
- [ ] **分享**: Web Share API 或 复制链接
- [ ] **保存 PC**: 触发下载
- [ ] **保存 移动端**: 弹出系统分享菜单
- [ ] **缩放**: 点击按钮或双击切换
- [ ] **拖拽**: 1:1 模式下可拖拽查看
- [ ] **边界**: 拖拽不能让图片完全离开视口

### 质量验收
- [ ] 无 JS 报错
- [ ] 过渡动画流畅
- [ ] Toast 正确显示
- [ ] 移动端无误触发浏览器手势

---

## 八、附录：SVG 图标

```html
<!-- 分享 -->
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>

<!-- 下载 -->
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>

<!-- 放大 -->
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>

<!-- 缩小 -->
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>

<!-- 左箭头 -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>

<!-- 右箭头 -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>

<!-- 关闭 -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
```
