// The site header: a sticky bar with the desktop navigation menu, a search
// popover, and a slide-in sheet on small screens. Built on Animate UI's
// animated Base UI primitives and icons.
import * as React from 'react';
import { motion, MotionConfig } from 'motion/react';
import { NavigationMenu } from '@animate-ui/react/primitives/base-ui/navigation-menu';
import { Dialog } from '@animate-ui/react/primitives/base-ui/dialog';
import { Collapsible } from '@animate-ui/react/primitives/base-ui/collapsible';
import { Popover } from '@animate-ui/react/primitives/base-ui/popover';
import { Menu } from '../animate-ui/icons/menu';
import { X } from '../animate-ui/icons/x';
import { Search } from '../animate-ui/icons/search';
import { ChevronDown } from '../animate-ui/icons/chevron-down';
import { ArrowRight } from '../animate-ui/icons/arrow-right';
import { Phone } from '../animate-ui/icons/phone';
import { Mail } from '../animate-ui/icons/mail';

export interface NavLink {
	href: string;
	label: string;
}

export interface NavItem extends NavLink {
	children?: NavLink[];
}

interface Props {
	items: NavItem[];
	/** The current page's pathname, used to mark the active section. */
	path: string;
	logo: string;
	siteName: string;
	contact: { phone: string; phoneHref: string; email: string };
}

/** Matches the CSS breakpoint where the desktop menu replaces the sheet. */
const DESKTOP_QUERY = '(min-width: 1024px)';

const isExternal = (href: string) => /^[a-z][a-z\d+.-]*:/i.test(href);
const withSlash = (p: string) => (p.endsWith('/') ? p : `${p}/`);

/** The link points at exactly this page. */
const isPage = (href: string, path: string) => !isExternal(href) && withSlash(href) === withSlash(path);

/** This page sits inside the link's section (e.g. an article under /articles/). */
const inSection = (href: string, path: string) =>
	!isExternal(href) && (href === '/' ? path === '/' : withSlash(path).startsWith(withSlash(href)));

const itemActive = (item: NavItem, path: string) =>
	inSection(item.href, path) || !!item.children?.some((c) => inSection(c.href, path));

const externalProps = (href: string) => (isExternal(href) ? { target: '_blank', rel: 'noopener' } : {});

export default function SiteHeader({ items, path, logo, siteName, contact }: Props) {
	const [scrolled, setScrolled] = React.useState(false);

	React.useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<MotionConfig reducedMotion="user">
			<header className="site-header" data-scrolled={scrolled || undefined}>
				<div className="container header-inner">
					<a className="brand" href="/" aria-label={`${siteName} home`}>
						<img src={logo} width="130" height="100" alt={siteName} />
					</a>
					<DesktopNav items={items} path={path} />
					<div className="header-actions">
						<SearchButton />
						<MobileMenu items={items} path={path} logo={logo} siteName={siteName} contact={contact} />
					</div>
				</div>
			</header>
		</MotionConfig>
	);
}

function DesktopNav({ items, path }: { items: NavItem[]; path: string }) {
	return (
		<NavigationMenu.Root className="nav" aria-label="Main">
			<NavigationMenu.List className="nav-list">
				{items.map((item) => {
					const active = itemActive(item, path) || undefined;

					if (!item.children?.length) {
						return (
							<NavigationMenu.Item key={item.href} className="nav-item">
								<NavigationMenu.Link
									className="nav-link"
									href={item.href}
									active={isPage(item.href, path)}
									data-section={active}
									{...externalProps(item.href)}
								>
									{item.label}
								</NavigationMenu.Link>
							</NavigationMenu.Item>
						);
					}

					// The trigger opens the panel, so the section's own page is
					// listed first inside it to keep it reachable.
					const links: NavLink[] = [{ href: item.href, label: 'Overview' }, ...item.children];
					return (
						<NavigationMenu.Item key={item.href} value={item.href} className="nav-item">
							<NavigationMenu.Trigger className="nav-link" data-section={active}>
								{item.label}
								<NavigationMenu.Icon className="nav-caret">
									<ChevronDown size={16} strokeWidth={2.4} />
								</NavigationMenu.Icon>
							</NavigationMenu.Trigger>
							<NavigationMenu.Content className="nav-panel">
								<p className="nav-panel-title">{item.label}</p>
								<ul className="nav-panel-list">
									{links.map((link) => (
										<li key={link.href}>
											<NavigationMenu.Link
												className="nav-panel-link"
												href={link.href}
												active={isPage(link.href, path)}
												closeOnClick
												{...externalProps(link.href)}
											>
												<span>{link.label}</span>
												<ArrowRight className="nav-panel-arrow" size={16} animateOnHover />
											</NavigationMenu.Link>
										</li>
									))}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					);
				})}
			</NavigationMenu.List>

			<NavigationMenu.Portal>
				<NavigationMenu.Positioner className="nav-positioner" sideOffset={14} align="start" alignOffset={-6} collisionPadding={16}>
					<NavigationMenu.Popup className="nav-popup">
						<NavigationMenu.Viewport className="nav-viewport" />
					</NavigationMenu.Popup>
				</NavigationMenu.Positioner>
			</NavigationMenu.Portal>
		</NavigationMenu.Root>
	);
}

function SearchButton() {
	const inputRef = React.useRef<HTMLInputElement>(null);

	return (
		<Popover.Root>
			<Popover.Trigger className="icon-btn" aria-label="Search">
				<Search size={21} animateOnHover />
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner className="search-positioner" side="bottom" align="end" sideOffset={14} collisionPadding={16}>
					<Popover.Popup className="search-popup" initialFocus={inputRef}>
						<Popover.Title className="sr-only">Search the site</Popover.Title>
						<form className="search-form" action="/search/" method="get" role="search">
							<label className="sr-only" htmlFor="header-search">
								Search
							</label>
							<input ref={inputRef} id="header-search" name="key" type="search" placeholder="Search articles, events, careers…" autoComplete="off" />
							<button type="submit" aria-label="Search">
								<Search size={20} />
							</button>
						</form>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

function MobileMenu({ items, path, logo, siteName, contact }: Props) {
	const [open, setOpen] = React.useState(false);
	const closeRef = React.useRef<HTMLButtonElement>(null);

	// Close the sheet if the window grows into the desktop layout.
	React.useEffect(() => {
		const query = window.matchMedia(DESKTOP_QUERY);
		const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	}, []);

	// Rows slide in one after another as the sheet opens.
	let row = 0;
	const enter = () => ({
		initial: { opacity: 0, x: 24 },
		animate: { opacity: 1, x: 0 },
		transition: { delay: 0.08 + row++ * 0.04, type: 'spring' as const, stiffness: 320, damping: 30 },
	});

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger className="icon-btn menu-btn" aria-label={open ? 'Close menu' : 'Open menu'}>
				<Menu size={26} animate={open} />
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Backdrop className="sheet-backdrop" />
				<Dialog.Popup data-side="right" className="sheet" initialFocus={closeRef}>
					<div className="sheet-head">
						<a className="brand" href="/" aria-label={`${siteName} home`}>
							<img src={logo} width="130" height="100" alt={siteName} />
						</a>
						<Dialog.Close ref={closeRef} className="icon-btn sheet-close" aria-label="Close menu">
							<X size={22} animateOnHover />
						</Dialog.Close>
					</div>
					<Dialog.Title className="sr-only">Menu</Dialog.Title>

					<nav className="sheet-nav" aria-label="Main">
						<ul>
							{items.map((item) => {
								const active = itemActive(item, path) || undefined;
								const current = isPage(item.href, path) ? ('page' as const) : undefined;

								if (!item.children?.length) {
									return (
										<motion.li key={item.href} {...enter()}>
											<a className="sheet-link" href={item.href} aria-current={current} data-section={active} {...externalProps(item.href)}>
												{item.label}
											</a>
										</motion.li>
									);
								}

								return (
									<motion.li key={item.href} {...enter()}>
										<Collapsible.Root defaultOpen={!!active} className="sheet-group">
											<div className="sheet-row">
												<a className="sheet-link" href={item.href} aria-current={current} data-section={active} {...externalProps(item.href)}>
													{item.label}
												</a>
												<Collapsible.Trigger className="sheet-toggle" aria-label={`${item.label} pages`}>
													<ChevronDown size={20} />
												</Collapsible.Trigger>
											</div>
											<Collapsible.Panel className="sheet-sub">
												<ul>
													{item.children.map((child) => (
														<li key={child.href}>
															<a
																className="sheet-sublink"
																href={child.href}
																aria-current={isPage(child.href, path) ? 'page' : undefined}
																{...externalProps(child.href)}
															>
																{child.label}
															</a>
														</li>
													))}
												</ul>
											</Collapsible.Panel>
										</Collapsible.Root>
									</motion.li>
								);
							})}
						</ul>
					</nav>

					<motion.div className="sheet-foot" {...enter()}>
						<p className="sheet-foot-title">Get in touch</p>
						<a className="sheet-contact" href={contact.phoneHref}>
							<span className="sheet-contact-icon">
								<Phone size={18} />
							</span>
							{contact.phone}
						</a>
						<a className="sheet-contact" href={`mailto:${contact.email}`}>
							<span className="sheet-contact-icon">
								<Mail size={18} />
							</span>
							{contact.email}
						</a>
					</motion.div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
