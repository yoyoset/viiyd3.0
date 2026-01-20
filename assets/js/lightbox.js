document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. Initialization & State
    // ---------------------------------------------------------
    const images = document.querySelectorAll('.prose img, .lightbox-trigger');
    if (images.length === 0) return;

    let currentIndex = 0;
    const imageList = Array.from(images);
    // isMobile still useful for "Logic" differences (like Web Share API support or specific touch behaviors)
    // But NOT for Layout/DOM structure decisions.
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Zoom State
    let isZoomed = false;
    let isDragging = false;
    let startX, startY, panX = 0, panY = 0;
    let lastTapTime = 0;

    // ---------------------------------------------------------
    // 2. DOM Elements Creation
    // ---------------------------------------------------------
    const lightbox = document.createElement('div');
    lightbox.id = 'v-lightbox';
    lightbox.className = 'fixed inset-0 z-[60] bg-neutral-900/95 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300';
    lightbox.style.touchAction = 'none';

    // Image Container
    const imgContainer = document.createElement('img');
    imgContainer.className = 'max-h-[90vh] max-w-[90vw] object-contain shadow-2xl transition-transform duration-200 select-none';
    imgContainer.style.cursor = 'zoom-in';
    imgContainer.draggable = false;

    // --- Toolbar Construction ---
    const toolbar = document.createElement('div');
    // Use Flexbox with 'justify-between' but use margins to center the middle element
    // Pointer events none on the toolbar container so clicks pass through to image, 
    // but re-enable on children buttons.
    toolbar.className = 'absolute bottom-0 left-0 right-0 p-4 pb-8 md:pb-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between z-[70] transition-transform duration-300 pointer-events-none';

    // ... icons definition ...

    const icons = {
        prev: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        next: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
        share: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>',
        save: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
        zoomIn: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
        zoomOut: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
        close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'
    };

    function createBtn(id, icon, classes = 'toolbar-btn') {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = classes;
        btn.innerHTML = icon;
        return btn;
    }

    // Controls Logic:
    // 1. Toolbar Arrows (Visible on Small Screens < md)
    const prevToolbar = createBtn('prev-toolbar', icons.prev, 'toolbar-btn md:hidden pointer-events-auto');
    const nextToolbar = createBtn('next-toolbar', icons.next, 'toolbar-btn md:hidden pointer-events-auto');

    // 2. Functional Buttons (Always Visible)
    const shareBtn = createBtn('share-btn', icons.share);
    const saveBtn = createBtn('save-btn', icons.save);
    const zoomBtn = createBtn('zoom-btn', icons.zoomIn);
    const counter = document.createElement('span');
    counter.className = 'text-white/70 text-sm font-mono mx-2 min-w-[3rem] text-center';

    const centerGroup = document.createElement('div');
    // mx-auto ensures it takes up center space when surrounded by flex items, or centers itself if alone
    centerGroup.className = 'flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md pointer-events-auto mx-auto';
    centerGroup.appendChild(shareBtn);
    centerGroup.appendChild(saveBtn);
    centerGroup.appendChild(zoomBtn);
    centerGroup.appendChild(counter);

    // 3. Assemble Toolbar
    // Layout: [Prev(mobile only)] ... [Center Group] ... [Next(mobile only)]
    toolbar.appendChild(prevToolbar);
    toolbar.appendChild(centerGroup);
    toolbar.appendChild(nextToolbar);

    // 4. Floating Arrows (PC Only - Visible on Medium Screens >= md)
    const prevFloating = createBtn('prev-floating', icons.prev, 'nav-btn absolute left-8 top-1/2 -translate-y-1/2 hidden md:flex');
    const nextFloating = createBtn('next-floating', icons.next, 'nav-btn absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex');

    // 5. Close Button (Persistent Top Right)
    const closeBtn = createBtn('close-btn', icons.close, 'close-btn absolute top-6 right-6 z-[80]');

    // Final Assembly
    lightbox.appendChild(imgContainer);
    lightbox.appendChild(toolbar);
    lightbox.appendChild(prevFloating);
    lightbox.appendChild(nextFloating);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);

    // ---------------------------------------------------------
    // 3. Logic & Handlers
    // ---------------------------------------------------------

    function showImage(index) {
        if (index < 0) index = imageList.length - 1;
        if (index >= imageList.length) index = 0;

        currentIndex = index;
        const sourceImg = imageList[currentIndex];

        if (isZoomed) toggleZoom();

        // 新增: 分别获取 web 和 original 版本
        const webSrc = sourceImg.getAttribute('data-web-src') || sourceImg.src;
        const fullSrc = sourceImg.getAttribute('data-full-res') || sourceImg.src;

        // 灯箱显示: web 版本
        imgContainer.src = webSrc;

        // 保存 full 版本供 save/zoom 使用
        imgContainer.dataset.fullRes = fullSrc;
        imgContainer.dataset.webSrc = webSrc;
        counter.textContent = `${currentIndex + 1}/${imageList.length}`;

        lightbox.classList.remove('opacity-0', 'pointer-events-none');
    }

    function closeLightbox() {
        lightbox.classList.add('opacity-0', 'pointer-events-none');
        if (isZoomed) toggleZoom();
        setTimeout(() => { imgContainer.src = ''; }, 300);
    }

    // Zoom
    function toggleZoom() {
        isZoomed = !isZoomed;
        if (isZoomed) {
            imgContainer.src = imgContainer.dataset.fullRes || imgContainer.src;
            imgContainer.style.maxWidth = 'none';
            imgContainer.style.maxHeight = 'none';
            imgContainer.style.cursor = 'grab';
            imgContainer.style.transform = 'translate(0, 0) scale(1)';
            zoomBtn.innerHTML = icons.zoomOut;
        } else {
            imgContainer.style.maxWidth = '90vw';
            imgContainer.style.maxHeight = '90vh';
            imgContainer.style.cursor = 'zoom-in';
            imgContainer.style.transform = '';
            imgContainer.src = imgContainer.dataset.webSrc || imgContainer.src;
            panX = 0; panY = 0;
            zoomBtn.innerHTML = icons.zoomIn;
        }
    }

    function calculateBounds() {
        const imgRect = imgContainer.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const overflowX = Math.max(0, imgRect.width - viewportW) / 2;
        const overflowY = Math.max(0, imgRect.height - viewportH) / 2;
        return { minX: -overflowX, maxX: overflowX, minY: -overflowY, maxY: overflowY };
    }

    // Share
    async function handleShare() {
        const imgSrc = imgContainer.dataset.webSrc || imgContainer.src;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'VIIYD Workspace', url: imgSrc });
            } catch (err) {
                if (err.name !== 'AbortError') copyToClipboard(imgSrc);
            }
        } else {
            copyToClipboard(imgSrc);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => showToast('Link copied')).catch(() => showToast('Failed to copy'));
    }

    // Save
    async function handleSave() {
        const imgSrc = imgContainer.dataset.fullRes || imgContainer.src;
        showToast('Saving...');
        try {
            const response = await fetch(imgSrc, { mode: 'cors' });
            if (!response.ok) throw new Error('Network response 404/500');
            const blob = await response.blob();

            if (isMobile && navigator.canShare) {
                const file = new File([blob], 'viiyd-artwork.jpg', { type: 'image/jpeg' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'VIIYD Artwork' });
                    return;
                }
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `viiyd-artwork-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Saved');
        } catch (err) {
            window.open(imgSrc, '_blank');
            showToast('Long press to save');
        }
    }

    function showToast(msg) {
        const existing = document.getElementById('v-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-neutral-800/90 border border-white/10 text-white text-sm rounded-full z-[80] shadow-xl backdrop-blur-md transition-opacity duration-300 pointer-events-none opacity-0';
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove('opacity-0'));
        setTimeout(() => { toast.classList.add('opacity-0'); setTimeout(() => toast.remove(), 300); }, 2000);
    }

    // ---------------------------------------------------------
    // 4. Wiring Events
    // ---------------------------------------------------------

    images.forEach((img, index) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => { e.stopPropagation(); showImage(index); });
    });

    const goPrev = () => showImage(currentIndex - 1);
    const goNext = () => showImage(currentIndex + 1);

    // All Buttons
    prevToolbar.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
    nextToolbar.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
    prevFloating.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
    nextFloating.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });

    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
    shareBtn.addEventListener('click', (e) => { e.stopPropagation(); handleShare(); });
    saveBtn.addEventListener('click', (e) => { e.stopPropagation(); handleSave(); });
    zoomBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleZoom(); });

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('opacity-0')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') goPrev();
        if (e.key === 'ArrowRight') goNext();
    });

    // Touch Zones
    lightbox.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        if (e.target === imgContainer) {
            const now = Date.now();
            if (now - lastTapTime < 300) toggleZoom();
            lastTapTime = now;
            return;
        }
        if (isZoomed) return;

        // Mouse/Touch simple zones
        const width = window.innerWidth;
        if (e.clientX < width * 0.3) goPrev();
        else if (e.clientX > width * 0.7) goNext();
        else closeLightbox();
    });

    // Drag Logic
    const handleStart = (x, y) => {
        if (isZoomed) { isDragging = true; startX = x; startY = y; imgContainer.style.cursor = 'grabbing'; }
    };
    const handleMove = (x, y, e) => {
        if (!isZoomed) return;
        if (isDragging) {
            e.preventDefault();
            const dx = x - startX, dy = y - startY;
            let newPanX = panX + dx, newPanY = panY + dy;
            const b = calculateBounds();
            if (newPanX > b.maxX) newPanX = b.maxX; if (newPanX < b.minX) newPanX = b.minX;
            if (newPanY > b.maxY) newPanY = b.maxY; if (newPanY < b.minY) newPanY = b.minY;
            imgContainer.style.transform = `translate(${newPanX}px, ${newPanY}px)`;
        }
    };
    const handleEnd = (x, y) => {
        if (isZoomed && isDragging) {
            isDragging = false;
            imgContainer.style.cursor = 'grab';
            const dx = x - startX, dy = y - startY;
            panX += dx; panY += dy;
            const b = calculateBounds(); // Re-clamp logic
            if (panX > b.maxX) panX = b.maxX; if (panX < b.minX) panX = b.minX;
            if (panY > b.maxY) panY = b.maxY; if (panY < b.minY) panY = b.minY;
        } else if (!isZoomed && typeof startX === 'number' && Math.abs(x - startX) > 50) {
            // Swipe
            if (x - startX > 0) goPrev(); else goNext();
        }
    };

    imgContainer.addEventListener('mousedown', e => { e.preventDefault(); handleStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove', e => { if (isDragging) handleMove(e.clientX, e.clientY, e); });
    window.addEventListener('mouseup', e => { if (isDragging) handleEnd(e.clientX, e.clientY); });

    lightbox.addEventListener('touchstart', e => { if (e.touches.length) { startX = e.touches[0].clientX; handleStart(e.touches[0].clientX, e.touches[0].clientY); } });
    lightbox.addEventListener('touchmove', e => { if (e.touches.length) handleMove(e.touches[0].clientX, e.touches[0].clientY, e); });
    lightbox.addEventListener('touchend', e => { if (e.changedTouches.length) handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
});
