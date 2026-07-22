import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowRight, FiArrowLeft, FiSearch, FiX } from 'react-icons/fi';

type SearchType = 'page' | 'news' | 'articles' | 'careers' | 'events';

type SearchEntry = {
	type: SearchType;
	title: string;
	excerpt: string;
	url: string;
};

type Props = {
	index: SearchEntry[];
	lang: 'en' | 'ar';
	dir: 'ltr' | 'rtl';
};

const typeLabels: Record<SearchType, { en: string; ar: string }> = {
	page: { en: 'Pages', ar: 'الصفحات' },
	news: { en: 'News', ar: 'الأخبار' },
	articles: { en: 'Articles', ar: 'المقالات' },
	careers: { en: 'Careers', ar: 'الوظائف' },
	events: { en: 'Events', ar: 'الفعاليات' },
};

const typeOrder: SearchType[] = ['page', 'news', 'articles', 'careers', 'events'];

export default function SiteSearch({ index, lang, dir }: Props) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);
	const ArrowIcon = dir === 'rtl' ? FiArrowLeft : FiArrowRight;

	const copy =
		lang === 'ar'
			? {
				triggerLabel: 'بحث',
				placeholder: 'ابحث في موقع مسار بتروليوم...',
				hint: 'اكتب للبحث في الصفحات والأخبار والمقالات والوظائف والفعاليات.',
				noResults: (q: string) => `لا توجد نتائج لـ "${q}"`,
				close: 'إغلاق البحث',
			}
			: {
				triggerLabel: 'Search',
				placeholder: 'Search Masar Petroleum...',
				hint: 'Search across pages, news, articles, careers, and events.',
				noResults: (q: string) => `No results for "${q}"`,
				close: 'Close search',
			};

	useEffect(() => {
		if (!open) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		document.addEventListener('keydown', handleEscape);
		document.body.style.overflow = 'hidden';
		const timer = window.setTimeout(() => inputRef.current?.focus(), 30);

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = '';
			window.clearTimeout(timer);
		};
	}, [open]);

	useEffect(() => {
		if (!open) setQuery('');
	}, [open]);

	const grouped = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return [];

		const matches = index.filter(
			(entry) => entry.title.toLowerCase().includes(trimmed) || entry.excerpt.toLowerCase().includes(trimmed),
		);

		return typeOrder
			.map((type) => ({ type, entries: matches.filter((entry) => entry.type === type) }))
			.filter((group) => group.entries.length > 0);
	}, [index, query]);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label={copy.triggerLabel}
				className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/45 bg-white/70 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
			>
				<FiSearch className="h-4 w-4" />
			</button>

			{open
				? createPortal(
						<div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[10vh]" role="dialog" aria-modal="true">
							<div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setOpen(false)} />

							<div dir={dir} className="relative flex w-full max-w-[640px] flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl dark:bg-slate-950">
								<div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
									<FiSearch className="h-5 w-5 shrink-0 text-slate-400" />
									<input
										ref={inputRef}
										type="text"
										value={query}
										onChange={(event) => setQuery(event.target.value)}
										placeholder={copy.placeholder}
										className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
									/>
									<button
										type="button"
										onClick={() => setOpen(false)}
										aria-label={copy.close}
										className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/10"
									>
										<FiX className="h-4.5 w-4.5" />
									</button>
								</div>

								<div className="max-h-[60vh] overflow-y-auto p-2">
									{query.trim() === '' ? (
										<p className="px-4 py-8 text-center text-sm text-slate-400">{copy.hint}</p>
									) : grouped.length === 0 ? (
										<p className="px-4 py-8 text-center text-sm text-slate-400">{copy.noResults(query.trim())}</p>
									) : (
										grouped.map((group) => (
											<div key={group.type} className="mb-2">
												<p className="px-3 pb-1 pt-3 text-xs font-extrabold uppercase tracking-[0.28em] text-masar-copper">
													{typeLabels[group.type][lang]}
												</p>
												{group.entries.map((entry) => (
													<a
														key={entry.url}
														href={entry.url}
														className="group flex items-center justify-between gap-3 rounded-[0.85rem] px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
													>
														<span className="min-w-0">
															<span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{entry.title}</span>
															<span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{entry.excerpt}</span>
														</span>
														<ArrowIcon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-masar-sky dark:text-slate-600" />
													</a>
												))}
											</div>
										))
									)}
								</div>
							</div>
						</div>,
						document.body,
					)
				: null}
		</>
	);
}
