import { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

type NavChild = { href: string; label: string };
type NavItem = { href: string; label: string; children?: NavChild[] };

type Props = {
	items: NavItem[];
	dir: 'ltr' | 'rtl';
	currentPath: string;
	homeHref: string;
};

const isActive = (href: string, currentPath: string, homeHref: string) => {
	if (href === currentPath) return true;
	if (href === homeHref) return false;
	return currentPath.startsWith(href);
};

export default function DesktopNav({ items, dir, currentPath, homeHref }: Props) {
	const [openDesktop, setOpenDesktop] = useState<string | null>(null);
	const desktopRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!openDesktop) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (!desktopRef.current?.contains(event.target as Node)) {
				setOpenDesktop(null);
			}
		};
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpenDesktop(null);
		};

		document.addEventListener('mousedown', handlePointerDown);
		document.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [openDesktop]);

	const menuAlign = dir === 'rtl' ? 'right-0' : 'left-0';

	return (
		<div ref={desktopRef} className="hidden items-center gap-1 text-sm font-semibold text-slate-700 dark:text-white/88 lg:flex">
			{items.map((item) =>
				item.children ? (
					<div key={item.href} className="relative">
						<button
							type="button"
							onClick={() => setOpenDesktop((current) => (current === item.href ? null : item.href))}
							aria-haspopup="menu"
							aria-expanded={openDesktop === item.href}
							className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-slate-900/5 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white ${
								isActive(item.href, currentPath, homeHref) ? 'bg-slate-900/8 text-slate-950 dark:bg-white/10 dark:text-white' : ''
							}`}
						>
							{item.label}
							<FiChevronDown className={`h-3.5 w-3.5 transition-transform ${openDesktop === item.href ? 'rotate-180' : ''}`} />
						</button>

						{openDesktop === item.href ? (
							<div
								role="menu"
								className={`absolute ${menuAlign} top-[3.1rem] flex min-w-[220px] flex-col gap-1 rounded-[1.1rem] border border-white/55 bg-white/96 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-slate-950/95`}
							>
								{item.children.map((child) => (
									<a
										key={child.href}
										href={child.href}
										role="menuitem"
										onClick={() => setOpenDesktop(null)}
										className={`rounded-[0.7rem] px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10 ${
											isActive(child.href, currentPath, homeHref) ? 'bg-slate-100 font-semibold text-slate-950 dark:bg-white/10 dark:text-white' : ''
										}`}
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
						className={`rounded-lg px-3 py-2 transition hover:bg-slate-900/5 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white ${
							isActive(item.href, currentPath, homeHref) ? 'bg-slate-900/8 text-slate-950 dark:bg-white/10 dark:text-white' : ''
						}`}
					>
						{item.label}
					</a>
				),
			)}
		</div>
	);
}
