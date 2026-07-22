import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiMenu, FiX } from 'react-icons/fi';

type NavChild = { href: string; label: string };
type NavItem = { href: string; label: string; children?: NavChild[] };

type Props = {
	items: NavItem[];
	dir: 'ltr' | 'rtl';
};

const copyFor = (dir: 'ltr' | 'rtl') =>
	dir === 'rtl'
		? { openMenu: 'فتح القائمة', closeMenu: 'إغلاق القائمة', menuHeading: 'القائمة' }
		: { openMenu: 'Open menu', closeMenu: 'Close menu', menuHeading: 'Menu' };

export default function MobileNav({ items, dir }: Props) {
	const copy = copyFor(dir);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

	useEffect(() => {
		if (!mobileOpen) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setMobileOpen(false);
		};
		document.addEventListener('keydown', handleEscape);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = '';
		};
	}, [mobileOpen]);

	return (
		<>
			<button
				type="button"
				onClick={() => setMobileOpen(true)}
				aria-label={copy.openMenu}
				aria-haspopup="dialog"
				aria-expanded={mobileOpen}
				className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/45 bg-white/70 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100 lg:hidden"
			>
				<FiMenu className="h-5 w-5" />
			</button>

			{mobileOpen
				? createPortal(
						<div className="fixed inset-0 z-[60] lg:hidden">
							<div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
							<div
								dir={dir}
								className={`absolute inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} flex w-[86%] max-w-[360px] flex-col gap-1 overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-950`}
							>
								<div className="mb-3 flex items-center justify-between">
									<span className="text-sm font-extrabold uppercase tracking-[0.3em] text-slate-400">{copy.menuHeading}</span>
									<button
										type="button"
										onClick={() => setMobileOpen(false)}
										aria-label={copy.closeMenu}
										className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
									>
										<FiX className="h-5 w-5" />
									</button>
								</div>

								{items.map((item) =>
									item.children ? (
										<div key={item.href} className="border-b border-slate-100 py-1 dark:border-white/10">
											<button
												type="button"
												onClick={() => setMobileExpanded((current) => (current === item.href ? null : item.href))}
												className="flex w-full items-center justify-between rounded-lg px-2 py-3 text-base font-semibold text-slate-800 dark:text-white"
												aria-expanded={mobileExpanded === item.href}
											>
												{item.label}
												<FiChevronDown className={`h-4 w-4 transition-transform ${mobileExpanded === item.href ? 'rotate-180' : ''}`} />
											</button>
											{mobileExpanded === item.href ? (
												<div className="flex flex-col gap-1 pb-2 ps-4">
													{item.children.map((child) => (
														<a
															key={child.href}
															href={child.href}
															onClick={() => setMobileOpen(false)}
															className="rounded-lg px-2 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
														>
															{child.label}
														</a>
													))}
												</div>
											) : null}
										</div>
									) : (
										<a
											key={item.href}
											href={item.href}
											onClick={() => setMobileOpen(false)}
											className="border-b border-slate-100 px-2 py-3 text-base font-semibold text-slate-800 dark:border-white/10 dark:text-white"
										>
											{item.label}
										</a>
									),
								)}
							</div>
						</div>,
						document.body,
					)
				: null}
		</>
	);
}
