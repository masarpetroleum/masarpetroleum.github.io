// Languages of the site, and the short interface texts in each.
//
// English lives at the root (/about/), Arabic under /ar/ (/ar/about/).
// Longer, editable texts are in src/data/*.json (English) and src/data/*.ar.json
// (Arabic); page content is in src/content/**/<name>.md and <name>.ar.md.

export const LOCALES = ['en', 'ar'] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LANG: Lang = 'en';

export const DIR: Record<Lang, 'ltr' | 'rtl'> = { en: 'ltr', ar: 'rtl' };
/** Open Graph locale codes. */
export const OG_LOCALE: Record<Lang, string> = { en: 'en_US', ar: 'ar_OM' };
/** The name of each language, written in that language. */
export const LANG_NAME: Record<Lang, string> = { en: 'English', ar: 'العربية' };

const isLang = (value: string | undefined): value is Lang => (LOCALES as readonly string[]).includes(value ?? '');

/** The value of the `[...lang]` route parameter: nothing for English, `ar` for Arabic. */
export const langFromParam = (param: string | undefined): Lang => (isLang(param) ? param : DEFAULT_LANG);

export function langFromPath(pathname: string): Lang {
	const first = pathname.split('/')[1];
	return isLang(first) && first !== DEFAULT_LANG ? first : DEFAULT_LANG;
}

/** `/ar/about/` → `/about/`. */
export function stripLang(pathname: string): string {
	const lang = langFromPath(pathname);
	if (lang === DEFAULT_LANG) return pathname || '/';
	return pathname.slice(lang.length + 1) || '/';
}

const isExternal = (href: string) => /^([a-z][a-z\d+.-]*:|\/\/|#)/i.test(href);

/** Puts a site path in the given language: `/about/` → `/ar/about/`. Other links are left alone. */
export function localizePath(href: string, lang: Lang): string {
	if (isExternal(href) || !href.startsWith('/')) return href;
	const path = stripLang(href);
	return lang === DEFAULT_LANG ? path : `/${lang}${path}`;
}

/** For `getStaticPaths` in src/pages/[...lang]/: one page per language. */
export const langPaths = () => LOCALES.map((lang) => ({ params: { lang: lang === DEFAULT_LANG ? undefined : lang }, props: { lang } }));

const en = {
	skip: 'Skip to content',
	home: 'Home',
	homeLabel: 'home',
	menu: 'Menu',
	mainNav: 'Main',
	openMenu: 'Open menu',
	closeMenu: 'Close menu',
	overview: 'Overview',
	pages: 'pages',
	getInTouch: 'Get in touch',
	language: 'Language',
	switchTo: 'العربية',
	switchToLabel: 'عرض الموقع بالعربية',

	search: 'Search',
	searchSite: 'Search the site',
	searchPlaceholder: 'Search articles, events, careers…',
	keyword: 'Keyword',
	searchDescription: 'Search Masar Petroleum news, events, articles and team.',
	searchPrompt: 'Type a keyword to search the site.',
	searching: 'Searching…',
	searchOne: '1 result for “{key}”',
	searchMany: '{n} results for “{key}”',
	searchNone: 'No results found for “{key}”.',
	searchError: 'Search is unavailable right now. Please try again.',

	heroLabel: 'Highlights',
	slideOf: '{i} of {n}',
	previousSlide: 'Previous slide',
	nextSlide: 'Next slide',
	pauseSlides: 'Pause slideshow',
	playSlides: 'Play slideshow',

	allNews: 'All news',
	allArticles: 'All articles',
	readMore: 'Read more',
	latestNews: 'Latest news',
	latestArticles: 'Latest articles',
	viewAll: 'View all',
	previousArticles: 'Previous articles',
	nextArticles: 'Next articles',
	relatedTopics: 'Related topics',
	photoGallery: 'Photo gallery',
	photo: 'photo',
	translationPending: 'This page is not yet available in Arabic, so it is shown in English.',

	labelNews: 'News',
	labelEvent: 'Event',
	labelArticle: 'Article',
	labelCompany: 'Company',
	labelCareers: 'Careers',
	labelTeam: 'Team',
	labelPage: 'Page',

	explore: 'Explore',
	contact: 'Contact',
	footerNav: 'Footer',
	backToTop: 'Back to top',

	phone: 'Phone',
	email: 'Email',
	sendMessage: 'Send us a message',
	name: 'Name',
	message: 'Message',
	send: 'Send message',
	trap: 'Leave this field empty',
	getDirections: 'Get directions',
	mapTitle: 'Map showing {place}',
	contactDescription: 'Contact {company} — {address} Phone {phone}.',
	formMissing: 'Please enter your name and a message.',
	formEmail: 'Please check the email address.',
	formCaptcha: 'Please complete the security check above the button.',
	formCaptchaFailed: 'The security check did not pass. Please try it again.',
	formSending: 'Sending…',
	formSent: 'Thank you. Your message has been sent to our team.',
	formTooMany: 'You have sent several messages already. Please try again later.',
	formCheck: 'Please check the form and try again.',
	formFallback: 'We could not send your message from this page, so your email app should now open with it ready to send.',
	mailSubject: 'Website enquiry from {name}',

	notFoundTitle: 'Page not found',
	notFoundText: 'The page you are looking for may have moved. Try searching, or head back home.',
	backHome: 'Back to home',

	lightbox: 'Image viewer',
	close: 'Close',
	previousImage: 'Previous image',
	nextImage: 'Next image',

	aboutDescription: 'Learn about Masar Petroleum SAOC — our company background and the team behind Block 7.',
	teamDescription: 'Meet the leadership and management team of Masar Petroleum.',
	careersDescription: 'Job opportunities at Masar Petroleum, Oman.',
	eventsDescription: 'News and events from Masar Petroleum, Block 7, Oman.',
	articlesDescription: 'Articles on oil and gas exploration, drilling and technology from Masar Petroleum.',
	newsDescription: 'The latest news from Masar Petroleum.',
};

export type UIKey = keyof typeof en;

const ar: Record<UIKey, string> = {
	skip: 'انتقل إلى المحتوى',
	home: 'الرئيسية',
	homeLabel: 'الصفحة الرئيسية',
	menu: 'القائمة',
	mainNav: 'القائمة الرئيسية',
	openMenu: 'فتح القائمة',
	closeMenu: 'إغلاق القائمة',
	overview: 'نظرة عامة',
	pages: 'صفحات',
	getInTouch: 'تواصل معنا',
	language: 'اللغة',
	switchTo: 'English',
	switchToLabel: 'View this site in English',

	search: 'بحث',
	searchSite: 'ابحث في الموقع',
	searchPlaceholder: 'ابحث في المقالات والأخبار والوظائف…',
	keyword: 'كلمة البحث',
	searchDescription: 'ابحث في أخبار مسار بتروليوم وفعالياتها ومقالاتها وفريقها.',
	searchPrompt: 'اكتب كلمة للبحث في الموقع.',
	searching: 'جارٍ البحث…',
	searchOne: 'نتيجة واحدة عن «{key}»',
	searchMany: 'نتائج البحث عن «{key}»: {n}',
	searchNone: 'لا توجد نتائج عن «{key}».',
	searchError: 'البحث غير متاح حاليًا. يُرجى المحاولة مرة أخرى.',

	heroLabel: 'أبرز العناوين',
	slideOf: '{i} من {n}',
	previousSlide: 'الشريحة السابقة',
	nextSlide: 'الشريحة التالية',
	pauseSlides: 'إيقاف العرض مؤقتًا',
	playSlides: 'تشغيل العرض',

	allNews: 'جميع الأخبار',
	allArticles: 'جميع المقالات',
	readMore: 'اقرأ المزيد',
	latestNews: 'آخر الأخبار',
	latestArticles: 'أحدث المقالات',
	viewAll: 'عرض الكل',
	previousArticles: 'المقالات السابقة',
	nextArticles: 'المقالات التالية',
	relatedTopics: 'مواضيع ذات صلة',
	photoGallery: 'معرض الصور',
	photo: 'صورة',
	translationPending: 'هذه الصفحة غير متوفرة بالعربية بعد، لذا تُعرض باللغة الإنجليزية.',

	labelNews: 'أخبار',
	labelEvent: 'فعالية',
	labelArticle: 'مقال',
	labelCompany: 'الشركة',
	labelCareers: 'وظائف',
	labelTeam: 'الفريق',
	labelPage: 'صفحة',

	explore: 'استكشف',
	contact: 'اتصل بنا',
	footerNav: 'روابط التذييل',
	backToTop: 'العودة إلى الأعلى',

	phone: 'الهاتف',
	email: 'البريد الإلكتروني',
	sendMessage: 'أرسل لنا رسالة',
	name: 'الاسم',
	message: 'الرسالة',
	send: 'إرسال الرسالة',
	trap: 'اترك هذا الحقل فارغًا',
	getDirections: 'الاتجاهات',
	mapTitle: 'خريطة توضّح موقع {place}',
	contactDescription: 'تواصل مع {company} — {address} هاتف {phone}.',
	formMissing: 'يُرجى إدخال اسمك ورسالتك.',
	formEmail: 'يُرجى التحقق من عنوان البريد الإلكتروني.',
	formCaptcha: 'يُرجى إكمال التحقق الأمني أعلى الزر.',
	formCaptchaFailed: 'لم ينجح التحقق الأمني. يُرجى المحاولة مرة أخرى.',
	formSending: 'جارٍ الإرسال…',
	formSent: 'شكرًا لك. تم إرسال رسالتك إلى فريقنا.',
	formTooMany: 'لقد أرسلت عدة رسائل بالفعل. يُرجى المحاولة لاحقًا.',
	formCheck: 'يُرجى مراجعة النموذج والمحاولة مرة أخرى.',
	formFallback: 'تعذّر إرسال رسالتك من هذه الصفحة، لذا سيُفتح تطبيق البريد لديك والرسالة جاهزة للإرسال.',
	mailSubject: 'استفسار عبر الموقع من {name}',

	notFoundTitle: 'الصفحة غير موجودة',
	notFoundText: 'ربما نُقلت الصفحة التي تبحث عنها. جرّب البحث أو عُد إلى الصفحة الرئيسية.',
	backHome: 'العودة إلى الرئيسية',

	lightbox: 'عارض الصور',
	close: 'إغلاق',
	previousImage: 'الصورة السابقة',
	nextImage: 'الصورة التالية',

	aboutDescription: 'تعرّف على مسار بتروليوم ش.م.ع.م — خلفية الشركة والفريق الذي يقف وراء منطقة الامتياز 7.',
	teamDescription: 'تعرّف على فريق القيادة والإدارة في مسار بتروليوم.',
	careersDescription: 'فرص العمل في مسار بتروليوم، سلطنة عُمان.',
	eventsDescription: 'أخبار وفعاليات مسار بتروليوم، منطقة الامتياز 7، سلطنة عُمان.',
	articlesDescription: 'مقالات من مسار بتروليوم حول استكشاف النفط والغاز والحفر والتقنية.',
	newsDescription: 'آخر أخبار مسار بتروليوم.',
};

export const UI: Record<Lang, Record<UIKey, string>> = { en, ar };

/** `const t = useT(lang); t('readMore')`, with `{name}` placeholders filled from the second argument. */
export function useT(lang: Lang) {
	return (key: UIKey, values: Record<string, string | number> = {}) =>
		UI[lang][key].replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

/**
 * Lays a translation over the English original: texts in `over` replace those
 * in `base`, and anything `over` leaves out (images, links, order) is kept.
 * Lists are matched item by item.
 */
export function overlay<T>(base: T, over: unknown): T {
	if (over === undefined || over === null || over === '') return base;
	if (Array.isArray(base)) {
		if (!Array.isArray(over)) return base;
		return base.map((item, i) => overlay(item, over[i])) as T;
	}
	if (base && typeof base === 'object') {
		if (typeof over !== 'object' || Array.isArray(over)) return base;
		const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
		for (const [key, value] of Object.entries(over as Record<string, unknown>)) {
			result[key] = key in result ? overlay(result[key], value) : value;
		}
		return result as T;
	}
	return (typeof over === typeof base ? over : base) as T;
}
