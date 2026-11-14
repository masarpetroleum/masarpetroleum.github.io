// Site-wide progressive enhancements: scroll reveal and the image lightbox.
// The header, menu and search live in components/header/SiteHeader.tsx.

// Reveal elements as they scroll into view.
const revealables = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
	const io = new IntersectionObserver(
		(entries) =>
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					io.unobserve(entry.target);
				}
			}),
		{ rootMargin: '0px 0px -60px 0px', threshold: 0.05 },
	);
	revealables.forEach((el) => io.observe(el));
} else {
	revealables.forEach((el) => el.classList.add('is-visible'));
}

// Lightbox for any link marked data-lightbox="<group>".
const lightbox = document.getElementById('lightbox');
if (lightbox) {
	const img = lightbox.querySelector('img')!;
	const count = lightbox.querySelector('.lb-count')!;
	const prev = lightbox.querySelector<HTMLButtonElement>('.lb-prev')!;
	const next = lightbox.querySelector<HTMLButtonElement>('.lb-next')!;
	let group: HTMLAnchorElement[] = [];
	let index = 0;
	let lastFocus: HTMLElement | null = null;

	const show = (i: number) => {
		index = (i + group.length) % group.length;
		const link = group[index];
		img.src = link.href;
		img.alt = link.querySelector('img')?.alt ?? '';
		count.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : '';
		prev.hidden = next.hidden = group.length < 2;
	};
	const close = () => {
		lightbox.classList.remove('is-open');
		lightbox.hidden = true;
		document.body.style.overflow = '';
		lastFocus?.focus();
	};

	document.addEventListener('click', (e) => {
		const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-lightbox]');
		if (!link) return;
		e.preventDefault();
		lastFocus = link;
		group = Array.from(document.querySelectorAll<HTMLAnchorElement>(`a[data-lightbox="${link.dataset.lightbox}"]`));
		show(group.indexOf(link));
		lightbox.hidden = false;
		lightbox.classList.add('is-open');
		document.body.style.overflow = 'hidden';
		lightbox.querySelector<HTMLButtonElement>('.lb-close')?.focus();
	});
	lightbox.querySelector('.lb-close')?.addEventListener('click', close);
	prev.addEventListener('click', () => show(index - 1));
	next.addEventListener('click', () => show(index + 1));
	lightbox.addEventListener('click', (e) => e.target === lightbox && close());

	// Swipe sideways on a touch screen to move between photos.
	let touchX: number | null = null;
	lightbox.addEventListener('touchstart', (e) => (touchX = e.touches.length === 1 ? e.touches[0].clientX : null), { passive: true });
	lightbox.addEventListener('touchend', (e) => {
		if (touchX === null || group.length < 2) return;
		const dx = e.changedTouches[0].clientX - touchX;
		touchX = null;
		if (Math.abs(dx) < 48) return;
		const rtl = document.documentElement.dir === 'rtl';
		show(index + (dx < 0 !== rtl ? 1 : -1));
	});
	document.addEventListener('keydown', (e) => {
		if (lightbox.hidden) return;
		if (e.key === 'Escape') close();
		// The arrow keys follow the buttons on screen, which swap sides in Arabic.
		const forward = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') show(index + (e.key === forward ? 1 : -1));
		// Keep keyboard focus inside the viewer while it is open.
		if (e.key === 'Tab') {
			const buttons = Array.from(lightbox.querySelectorAll<HTMLButtonElement>('button:not([hidden])'));
			const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
			e.preventDefault();
			buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
		}
	});

	// Images inside article bodies open in the lightbox too.
	document.querySelectorAll<HTMLImageElement>('.prose img').forEach((el) => {
		if (el.closest('a, [style*="border-left"]')) return;
		const a = document.createElement('a');
		a.href = el.currentSrc || el.src;
		a.dataset.lightbox = 'body';
		el.replaceWith(a);
		a.appendChild(el);
	});
}
