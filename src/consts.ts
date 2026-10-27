// Editable site data lives in src/data/*.json (managed from /admin/).
// This module re-exports it with types for the components.
import settings from './data/settings.json';
import navigation from './data/navigation.json';
import home from './data/home.json';
import pages from './data/pages.json';

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

export const SITE = {
	name: settings.siteName,
	title: settings.title,
	description: settings.description,
	keywords: settings.keywords,
	logo: settings.logo,
	ogImage: settings.ogImage,
	gaId: settings.gaId,
};

export const CONTACT = {
	...settings.contact,
	address: [settings.contact.addressLine1, settings.contact.addressLine2].filter(Boolean),
	phoneHref: `tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`,
};

export const FOOTER = settings.footer;
export const NAV: NavItem[] = navigation.items;
export const HOME = home as Omit<typeof home, 'slides'> & { slides: Slide[] };
export const PAGES = pages;
