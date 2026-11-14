// Editable site data lives in src/data/*.json (managed from /admin/); the Arabic
// texts are in the matching *.ar.json files. This module hands both to the
// components, typed, in the language of the page.
import settings from './data/settings.json';
import settingsAr from './data/settings.ar.json';
import navigation from './data/navigation.json';
import navigationAr from './data/navigation.ar.json';
import home from './data/home.json';
import homeAr from './data/home.ar.json';
import pages from './data/pages.json';
import pagesAr from './data/pages.ar.json';
import { DEFAULT_LANG, localizePath, overlay, type Lang } from './i18n';

export interface NavItem {
	href: string;
	label: string;
	children?: Array<{ href: string; label: string }>;
}

export interface Slide {
	image: string;
	title: string;
	subtitle?: string;
	ctaLabel?: string;
	ctaHref?: string;
	theme?: 'light' | 'dark';
}

/** Receives the contact form (the Cloudflare Worker in /worker). Messages are read at /admin/messages.html. */
export const MESSAGES_API = 'https://masar-messages.miladsoft.workers.dev/messages';

/** Public site key of the Cloudflare Turnstile captcha on the contact form (its secret lives in the Worker). */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAF-KsEoRL3-R5Fkd';

const ARABIC = { settings: settingsAr, navigation: navigationAr, home: homeAr, pages: pagesAr };

/** "More about us..." reads better without the dots next to an arrow. */
const tidy = (label = '') => label.replace(/\s*(\.{2,}|…)\s*$/, '');

/** Everything from src/data, in the given language, with site links pointing at that language. */
export function siteData(lang: Lang) {
	const translated = lang !== DEFAULT_LANG;
	const s = translated ? overlay(settings, ARABIC.settings) : settings;
	const n = translated ? overlay(navigation, ARABIC.navigation) : navigation;
	const h = (translated ? overlay(home, ARABIC.home) : home) as Omit<typeof home, 'slides'> & { slides: Slide[] };
	const p = translated ? overlay(pages, ARABIC.pages) : pages;
	const link = <T extends { href: string }>(item: T): T => ({ ...item, href: localizePath(item.href, lang) });

	return {
		SITE: {
			name: s.siteName,
			title: s.title,
			description: s.description,
			keywords: s.keywords,
			logo: s.logo,
			ogImage: s.ogImage,
			gaId: s.gaId,
		},
		CONTACT: {
			...s.contact,
			address: [s.contact.addressLine1, s.contact.addressLine2].filter(Boolean),
			phoneHref: `tel:${s.contact.phone.replace(/[^\d+]/g, '')}`,
		},
		FOOTER: { ...s.footer, links: s.footer.links.map(link) },
		NAV: (n.items as NavItem[]).map((item) => ({ ...link(item), children: item.children?.map(link) })),
		HOME: {
			...h,
			slides: h.slides.map((slide) => ({
				...slide,
				ctaLabel: tidy(slide.ctaLabel),
				ctaHref: slide.ctaHref && localizePath(slide.ctaHref, lang),
			})),
			intro: { ...h.intro, buttonLabel: tidy(h.intro.buttonLabel), buttonHref: localizePath(h.intro.buttonHref, lang) },
		},
		PAGES: { ...p, about: { ...p.about, cards: p.about.cards.map(link) } },
	};
}
