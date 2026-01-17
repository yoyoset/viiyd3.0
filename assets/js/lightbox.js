document.addEventListener('DOMContentLoaded', () => {
    // Select all images inside article content (adjust selector as needed)
    // Select prose images AND explicit lightbox triggers
    const images = document.querySelectorAll('.prose img, .lightbox-trigger');

    // Create Lightbox Elements
    const lightbox = document.createElement('div');
    lightbox.id = 'v-lightbox';
    lightbox.className = 'fixed inset-0 z-[60] bg-neutral-900/95 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300';

    const imgContainer = document.createElement('img');
    imgContainer.className = 'max-h-[90vh] max-w-[90vw] object-contain shadow-2xl';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute top-4 right-4 text-white text-4xl hover:text-gold-400 transition-colors z-[60]';
    closeBtn.innerHTML = '&times;';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gold-400 transition-colors p-2 hidden md:block z-[60]';
    prevBtn.innerHTML = '&#10094;'; // Left arrow

    const nextBtn = document.createElement('button');
    nextBtn.className = 'absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gold-400 transition-colors p-2 hidden md:block z-[60]';
    nextBtn.innerHTML = '&#10095;'; // Right arrow

    lightbox.appendChild(imgContainer);
    lightbox.appendChild(closeBtn);
    lightbox.appendChild(prevBtn);
    lightbox.appendChild(nextBtn);
    document.body.appendChild(lightbox);

    let currentIndex = 0;
    const imageList = Array.from(images);

    function showImage(index) {
        if (index < 0) index = imageList.length - 1;
        if (index >= imageList.length) index = 0;

        currentIndex = index;
        const sourceImg = imageList[currentIndex];

        // Use high-res source if available, fallback to src
        // Assuming your shortcode might set a data-src for highRes or just use src
        imgContainer.src = sourceImg.src;

        lightbox.classList.remove('opacity-0', 'pointer-events-none');
    }

    function closeLightbox() {
        lightbox.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            imgContainer.src = '';
        }, 300);
    }

    // Event Listeners
    images.forEach((img, index) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling issues
            showImage(index);
        });
    });

    closeBtn.addEventListener('click', closeLightbox);

    // Close on click outside (background)
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Navigation
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage(currentIndex - 1);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage(currentIndex + 1);
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('opacity-0')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    });

    // Touch Swipe Gestures
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            // Swipe Left -> Next
            showImage(currentIndex + 1);
        }
        if (touchEndX > touchStartX + threshold) {
            // Swipe Right -> Prev
            showImage(currentIndex - 1);
        }
    }
});
