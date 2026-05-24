document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.lightbox-trigger');
    if (images.length === 0) return;

    let currentIndex = 0;
    const imageList = Array.from(images);
    let isZoomed = false, isDragging = false;
    let startX, startY, panX = 0, panY = 0, lastTapTime = 0;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // ── icons ─────────────────────────────────────────────────
    const icons = {
        prev:    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
        next:    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
        share:   '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>',
        save:    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
        zoomIn:  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
        zoomOut: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
        close:   '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>',
    };

    // ── helpers ────────────────────────────────────────────────
    function el(tag, styles, html) {
        const e = document.createElement(tag);
        if (styles) Object.assign(e.style, styles);
        if (html)   e.innerHTML = html;
        return e;
    }
    function btn(icon, extraStyle) {
        const b = el('button', Object.assign({
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', padding: '6px', lineHeight: '0',
            opacity: '0.75', transition: 'opacity 0.15s',
            pointerEvents: 'auto',
        }, extraStyle), icon);
        b.addEventListener('mouseenter', () => b.style.opacity = '1');
        b.addEventListener('mouseleave', () => b.style.opacity = '0.75');
        return b;
    }

    // ── DOM construction ───────────────────────────────────────
    // Overlay
    const lb = el('div', {
        position: 'fixed', inset: '0', zIndex: '9000',
        background: 'rgba(8,7,6,0.96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: '0', pointerEvents: 'none',
        transition: 'opacity 0.25s', touchAction: 'none',
    });

    // Main image
    const imgEl = el('img', {
        maxWidth: '90vw', maxHeight: '90vh',
        objectFit: 'contain', display: 'block',
        userSelect: 'none', cursor: 'zoom-in',
        transition: 'transform 0.2s',
    });
    imgEl.draggable = false;

    // Toolbar (bottom bar)
    const toolbar = el('div', {
        position: 'absolute', bottom: '0', left: '0', right: '0',
        padding: '16px 16px 36px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: '70', pointerEvents: 'none',
    });

    // Mobile-only prev/next in toolbar
    const prevTb = btn(icons.prev, { display: window.innerWidth >= 768 ? 'none' : 'flex' });
    const nextTb = btn(icons.next, { display: window.innerWidth >= 768 ? 'none' : 'flex' });

    // Center action group
    const centerGroup = el('div', {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(0,0,0,0.45)', padding: '8px 18px',
        borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)',
        pointerEvents: 'auto', margin: '0 auto',
    });
    const shareBtn = btn(icons.share);
    const saveBtn  = btn(icons.save);
    const zoomBtn  = btn(icons.zoomIn);
    const counter  = el('span', {
        color: 'rgba(255,255,255,0.65)', fontSize: '11px',
        fontFamily: 'monospace', minWidth: '3em', textAlign: 'center',
    });
    centerGroup.append(shareBtn, saveBtn, zoomBtn, counter);

    toolbar.append(prevTb, centerGroup, nextTb);

    // Floating desktop prev/next
    const floatStyle = {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '50%', width: '48px', height: '48px',
        display: window.innerWidth >= 768 ? 'flex' : 'none',
        alignItems: 'center', justifyContent: 'center',
        color: '#fff', cursor: 'pointer',
        opacity: '0.65', transition: 'opacity 0.15s', pointerEvents: 'auto',
    };
    const prevFl = btn(icons.prev, Object.assign({}, floatStyle, { left: '32px' }));
    const nextFl = btn(icons.next, Object.assign({}, floatStyle, { right: '32px' }));

    // Close button
    const closeBtn = btn(icons.close, {
        position: 'absolute', top: '24px', right: '24px',
        zIndex: '80', opacity: '0.7',
    });

    // Assemble
    lb.append(imgEl, toolbar, prevFl, nextFl, closeBtn);
    document.body.appendChild(lb);

    // Responsive: update display on resize
    window.addEventListener('resize', () => {
        const wide = window.innerWidth >= 768;
        prevTb.style.display = wide ? 'none' : 'flex';
        nextTb.style.display = wide ? 'none' : 'flex';
        prevFl.style.display = wide ? 'flex' : 'none';
        nextFl.style.display = wide ? 'flex' : 'none';
    });

    // ── logic ──────────────────────────────────────────────────
    function open(index) {
        if (index < 0) index = imageList.length - 1;
        if (index >= imageList.length) index = 0;
        currentIndex = index;
        if (isZoomed) resetZoom();

        const src = imageList[currentIndex];
        const webSrc  = src.getAttribute('data-web-src')  || src.src;
        const fullSrc = src.getAttribute('data-full-res') || src.src;

        imgEl.src = webSrc;
        imgEl.dataset.webSrc  = webSrc;
        imgEl.dataset.fullRes = fullSrc;
        counter.textContent   = `${currentIndex + 1} / ${imageList.length}`;

        lb.style.opacity      = '1';
        lb.style.pointerEvents = 'auto';
        document.body.style.overflow = 'hidden';
    }

    function close() {
        lb.style.opacity      = '0';
        lb.style.pointerEvents = 'none';
        document.body.style.overflow = '';
        if (isZoomed) resetZoom();
        setTimeout(() => { imgEl.src = ''; }, 250);
    }

    function resetZoom() {
        isZoomed = false; panX = 0; panY = 0;
        imgEl.style.maxWidth  = '90vw';
        imgEl.style.maxHeight = '90vh';
        imgEl.style.cursor    = 'zoom-in';
        imgEl.style.transform = '';
        zoomBtn.innerHTML = icons.zoomIn;
    }

    function toggleZoom() {
        isZoomed = !isZoomed;
        if (isZoomed) {
            imgEl.src = imgEl.dataset.fullRes || imgEl.src;
            imgEl.style.maxWidth  = 'none';
            imgEl.style.maxHeight = 'none';
            imgEl.style.cursor    = 'grab';
            imgEl.style.transform = 'translate(0,0) scale(1)';
            zoomBtn.innerHTML = icons.zoomOut;
        } else {
            imgEl.src = imgEl.dataset.webSrc || imgEl.src;
            resetZoom();
        }
    }

    function calcBounds() {
        const r = imgEl.getBoundingClientRect();
        const ox = Math.max(0, r.width  - window.innerWidth)  / 2;
        const oy = Math.max(0, r.height - window.innerHeight) / 2;
        return { minX: -ox, maxX: ox, minY: -oy, maxY: oy };
    }

    function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

    // ── share / save ───────────────────────────────────────────
    async function handleShare() {
        const url = imgEl.dataset.webSrc || imgEl.src;
        if (navigator.share) {
            try { await navigator.share({ title: 'VIIYD', url }); return; }
            catch(e) { if (e.name === 'AbortError') return; }
        }
        navigator.clipboard.writeText(url).then(() => toast('Link copied')).catch(() => toast('Copy failed'));
    }

    async function handleSave() {
        const url = imgEl.dataset.fullRes || imgEl.src;
        toast('Saving…');
        try {
            const res = await fetch(url, { mode: 'cors' });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            if (isMobile && navigator.canShare) {
                const file = new File([blob], 'viiyd.webp', { type: 'image/webp' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'VIIYD Artwork' });
                    return;
                }
            }
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `viiyd-${Date.now()}.webp`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast('Saved');
        } catch { window.open(url, '_blank'); toast('Long press to save'); }
    }

    function toast(msg) {
        document.getElementById('v-toast')?.remove();
        const t = el('div', {
            position: 'fixed', bottom: '88px', left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 24px',
            background: 'rgba(20,18,15,0.92)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontSize: '12px', letterSpacing: '0.06em',
            borderRadius: '999px', zIndex: '9100',
            pointerEvents: 'none', opacity: '0', transition: 'opacity 0.25s',
            whiteSpace: 'nowrap',
        }, msg);
        t.id = 'v-toast';
        document.body.appendChild(t);
        requestAnimationFrame(() => t.style.opacity = '1');
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
    }

    // ── event wiring ───────────────────────────────────────────
    imageList.forEach((img, i) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', e => { e.stopPropagation(); open(i); });
    });

    const goPrev = () => open(currentIndex - 1);
    const goNext = () => open(currentIndex + 1);

    prevTb.addEventListener('click',  e => { e.stopPropagation(); goPrev(); });
    nextTb.addEventListener('click',  e => { e.stopPropagation(); goNext(); });
    prevFl.addEventListener('click',  e => { e.stopPropagation(); goPrev(); });
    nextFl.addEventListener('click',  e => { e.stopPropagation(); goNext(); });
    closeBtn.addEventListener('click', e => { e.stopPropagation(); close(); });
    shareBtn.addEventListener('click', e => { e.stopPropagation(); handleShare(); });
    saveBtn.addEventListener('click',  e => { e.stopPropagation(); handleSave(); });
    zoomBtn.addEventListener('click',  e => { e.stopPropagation(); toggleZoom(); });

    document.addEventListener('keydown', e => {
        if (lb.style.opacity === '0') return;
        if (e.key === 'Escape')     close();
        if (e.key === 'ArrowLeft')  goPrev();
        if (e.key === 'ArrowRight') goNext();
    });

    lb.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        if (e.target === imgEl) {
            const now = Date.now();
            if (now - lastTapTime < 300) toggleZoom();
            lastTapTime = now;
            return;
        }
        if (isZoomed) return;
        const x = e.clientX, w = window.innerWidth;
        if (x < w * 0.3) goPrev();
        else if (x > w * 0.7) goNext();
        else close();
    });

    // drag / pan when zoomed
    const onDragStart = (x, y) => { if (isZoomed) { isDragging = true; startX = x; startY = y; imgEl.style.cursor = 'grabbing'; } else { startX = x; startY = y; } };
    const onDragMove  = (x, y, e) => {
        if (!isDragging || !isZoomed) return;
        e.preventDefault();
        const b = calcBounds();
        panX = clamp(panX + (x - startX), b.minX, b.maxX);
        panY = clamp(panY + (y - startY), b.minY, b.maxY);
        imgEl.style.transform = `translate(${panX}px,${panY}px)`;
        startX = x; startY = y;
    };
    const onDragEnd = (x, y) => {
        if (isZoomed && isDragging) {
            isDragging = false; imgEl.style.cursor = 'grab';
        } else if (!isZoomed && typeof startX === 'number' && Math.abs(x - startX) > 50) {
            x - startX > 0 ? goPrev() : goNext();
        }
    };

    imgEl.addEventListener('mousedown',     e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove',    e => { if (isDragging) onDragMove(e.clientX, e.clientY, e); });
    window.addEventListener('mouseup',      e => { if (isDragging) onDragEnd(e.clientX, e.clientY); });
    lb.addEventListener('touchstart',  e => { if (e.touches.length) onDragStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    lb.addEventListener('touchmove',   e => { if (e.touches.length) onDragMove(e.touches[0].clientX, e.touches[0].clientY, e); }, { passive: false });
    lb.addEventListener('touchend',    e => { if (e.changedTouches.length) onDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
});
