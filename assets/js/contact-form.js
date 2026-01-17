// Image Preview
const imageInput = document.getElementById('image-input');
const preview = document.getElementById('image-preview');

imageInput?.addEventListener('change', () => {
    preview.innerHTML = '';
    const files = Array.from(imageInput.files).slice(0, 3); // Max 3
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'w-20 h-20 rounded-lg overflow-hidden border border-white/10';
            div.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
});

// Form Submit
document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const statusEl = document.getElementById('form-status');

    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    try {
        const formData = new FormData(form);

        // Limit to 3 images
        const images = formData.getAll('images');
        formData.delete('images');
        images.slice(0, 3).forEach(img => formData.append('images', img));

        // Note: The worker domain needs to be replaced with the actual one after deployment
        // or handled via environment variable / Hugo params if possible. 
        // For now, we use a placeholder or assume the user will configure it.
        // The implementation plan had 'https://viiyd-contact-handler.YOUR_SUBDOMAIN.workers.dev'
        // I will use a relative path '/api/contact' which we can proxy or just let the user change it.
        // Actually, let's stick to the plan's placeholder but maybe make it easier to find.
        // The plan has: https://viiyd-contact-handler.YOUR_SUBDOMAIN.workers.dev

        // Wait, I should probably ask the user for their subdomain or just use a placeholder that they MUST replace.
        // Or I can use a local relative path if I set up a proxy, but that's overcomplicating.
        // I'll use the placeholder and instruct the user to update it.

        const workerUrl = 'https://viiyd-contact-handler.viiyd.workers.dev'; // Assuming 'viiyd' might be the subdomain or just a placeholder. 
        // Actually, let's look at `wrangler.toml` name 'viiyd-contact-handler'. 
        // If user deploys, it will be `viiyd-contact-handler.<user-subdomain>.workers.dev`.
        // I'll leave a TODO comment or a variable that is clearly a placeholder.
        // But the JS code needs to work.

        // Since I cannot know the subdomain until deployment, I will hardcode the logic to logic for now 
        // but maybe I can fetch it from a data attribute in the HTML if I put it there from hugo config.
        // That's a better approach.

        // Let's modify the contact.html to include the worker URL from site params if available, 
        // or just put a placeholder here.
        // I'll check `hugo.toml` in the next phase. For now, I'll use a data attribute on the form.
        // `data-worker-url`. I'll update `contact.html` again or just assume the user will edit this JS.
        // The plan didn't specify passing the URL from Hugo.
        // I'll just use a const for now and notify user to change it.

        const workerUrlToUse = 'https://viiyd-contact-handler.yoyoset.workers.dev';

        const response = await fetch(workerUrlToUse, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            statusEl.className = 'text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400';
            statusEl.innerHTML = '✓ ' + (document.documentElement.lang === 'zh' ? '提交成功！我们会尽快回复您。' : 'Submitted! We will reply soon.');
            statusEl.classList.remove('hidden');
            form.reset();
            preview.innerHTML = '';
            if (typeof turnstile !== 'undefined') turnstile.reset();
        } else {
            throw new Error(result.error || 'Failed');
        }
    } catch (err) {
        statusEl.className = 'text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400';
        statusEl.textContent = '✗ ' + err.message;
        statusEl.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
});
