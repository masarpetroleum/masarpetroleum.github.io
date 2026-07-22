import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiGlobe, FiMoon, FiSun } from 'react-icons/fi';

type Props = {
	lang: 'en' | 'ar';
	dir: 'ltr' | 'rtl';
};

type Theme = 'light' | 'dark';

const languageOptions = {
	en: [
		{ href: '/en/', label: 'English', active: true },
		{ href: '/ar/', label: 'العربية', active: false },
	],
	ar: [
		{ href: '/ar/', label: 'العربية', active: true },
		{ href: '/en/', label: 'English', active: false },
	],
} as const;

export default function HeaderControls({ lang, dir }: Props) {
	const [theme, setTheme] = useState<Theme>('light');
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = document.documentElement;
		const body = document.body;
		const nextTheme = root.classList.contains('dark') || body.classList.contains('dark') ? 'dark' : 'light';
		setTheme(nextTheme);
	}, []);

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
			}
		};

		document.addEventListener('mousedown', handlePointerDown);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [open]);

	const toggleTheme = () => {
		const nextTheme = theme === 'dark' ? 'light' : 'dark';
		const root = document.documentElement;
		const body = document.body;

		root.classList.toggle('dark', nextTheme === 'dark');
		body.classList.toggle('dark', nextTheme === 'dark');
		localStorage.setItem('masar-theme', nextTheme);
		setTheme(nextTheme);
	};

	const options = languageOptions[lang];
	const activeLanguage = options.find((option) => option.active)?.label ?? 'Language';
	const menuAlign = dir === 'rtl' ? 'left-0' : 'right-0';

	return (
		<div className="flex items-center gap-2 sm:gap-3">
			<button
				type="button"
				onClick={toggleTheme}
				className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/45 bg-white/70 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
				aria-label={theme === 'dark' ? 'Activate light theme' : 'Activate dark theme'}
			>
				{theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
			</button>

			<div className="relative" ref={menuRef}>
				<button
					type="button"
					onClick={() => setOpen((current) => !current)}
					aria-haspopup="menu"
					aria-expanded={open}
					className="inline-flex h-11 items-center gap-2 rounded-[1rem] border border-white/45 bg-white/75 px-4 text-sm font-semibold text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
				>
					<FiGlobe className="h-4 w-4" />
					<span>{activeLanguage}</span>
					<FiChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
				</button>

				{open ? (
					<div
						className={`absolute ${menuAlign} top-14 flex min-w-[188px] flex-col gap-2 rounded-[1.25rem] border border-white/55 bg-white/94 p-2.5 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-slate-950/92`}
						role="menu"
					>
						{options.map((option) => (
							<a
								key={option.href}
								href={option.href}
								className={`flex items-center justify-between rounded-[0.95rem] px-4 py-3 text-sm font-medium transition ${
									option.active
										? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
										: 'border border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10'
								}`}
								role="menuitem"
								onClick={() => setOpen(false)}
							>
								<span>{option.label}</span>
								{option.active ? <FiCheck className="h-4 w-4" /> : null}
							</a>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}