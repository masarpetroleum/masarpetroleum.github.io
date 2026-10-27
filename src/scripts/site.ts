// Site-wide progressive enhancements: header, mobile drawer, search panel,
// scroll reveal, image lightbox, and the mobile back button.

const root = document.documentElement;

// Compact the sticky header once the page scrolls.
const header = document.getElementById('site-header');
if (header) {
	const onScroll = () => header.classList.toggle('is-compact', window.scrollY > 40);
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });
}

// Mobile drawer.
const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const setMenu = (open: boolean) => {
	root.classList.toggle('menu-open', open);
	document.body.classList.toggle('menu-open', open);
	menuToggle?.setAttribute('aria-expanded', String(open));
};
menuToggle?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
document.querySelectorAll('[data-menu-close]').forEach((el) => el.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') setMenu(false);
});
window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => e.matches && setMenu(false));

// Desktop search panel.
const searchPanel = document.getElementById('search-panel');
document.querySelectorAll<HTMLButtonElement>('[data-search-toggle]').forEach((btn) =>
	btn.addEventListener('click', () => {
		const open = !searchPanel?.classList.contains('is-open');
		searchPanel?.classList.toggle('is-open', open);
		btn.setAttribute('aria-expanded', String(open));
		if (open) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			searchPanel?.querySelector('input')?.focus();
		}
	}),
);

// Mobile back button: only shown when there is somewhere to go back to.
const back = document.querySelector<HTMLButtonElement>('[data-back]');
if (back && document.referrer && new URL(document.referrer).origin === location.origin) {
	back.hidden = false;
	back.addEventListener('click', () => history.back());
}

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
	document.addEventListener('keydown', (e) => {
		if (lightbox.hidden) return;
		if (e.key === 'Escape') close();
		if (e.key === 'ArrowLeft') show(index - 1);
		if (e.key === 'ArrowRight') show(index + 1);
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
