export type Language = 'en' | 'ar';

export interface SiteContent {
	lang: Language;
	dir: 'ltr' | 'rtl';
	label: string;
	switchHref: string;
	switchLabel: string;
	nav: Array<{ href: string; label: string }>;
	hero: {
		eyebrow: string;
		title: string;
		description: string;
		primaryCta: { href: string; label: string };
		secondaryCta: { href: string; label: string };
		highlights: string[];
	};
	metrics: Array<{ value: string; label: string }>;
	about: {
		title: string;
		text: string;
		cards: Array<{ title: string; text: string }>;
	};
	operations: {
		title: string;
		items: Array<{ title: string; text: string }>;
	};
	impact: {
		title: string;
		text: string;
		pillars: string[];
	};
	news: {
		kicker: string;
		title: string;
		items: Array<{ title: string; text: string }>;
	};
	contact: {
		title: string;
		text: string;
		phoneLabel: string;
		phone: string;
		linkedinLabel: string;
		linkedin: string;
		locationLabel: string;
		location: string;
	};
	footer: string;
}

export const siteContent: Record<Language, SiteContent> = {
	en: {
		lang: 'en',
		dir: 'ltr',
		label: 'English',
		switchHref: '/ar/',
		switchLabel: 'AR',
		nav: [
			{ href: '/en/about/', label: 'About' },
			{ href: '/en/operations/', label: 'Operations' },
			{ href: '/en/impact/', label: 'Impact' },
			{ href: '/en/news/', label: 'News' },
			{ href: '/en/contact/', label: 'Contact' },
		],
		hero: {
			eyebrow: 'Oman energy company',
			title: 'Pioneering responsible growth in exploration and production.',
			description: 'Focused Omani energy expertise with disciplined execution and clear momentum.',
			primaryCta: { href: '/en/operations/', label: 'Explore operations' },
			secondaryCta: { href: '/en/contact/', label: 'Contact the team' },
			highlights: [
				'100% ownership of Block 7 in Sahmah, Oman',
				'Operating since 2015',
				'Safety-led field delivery',
			],
		},
		metrics: [
			{ value: '2015', label: 'Operations launched' },
			{ value: '100%', label: 'Working interest in Block 7' },
			{ value: '24/7', label: 'Field and technical coordination' },
		],
		about: {
			title: 'Built for the next chapter of Omani energy.',
			text: 'Masar Petroleum moves opportunities from subsurface insight to practical field execution.',
			cards: [
				{
					title: 'Subsurface intelligence',
					text: 'Geoscience and reservoir work that sharpens drilling decisions.',
				},
				{
					title: 'Operational resilience',
					text: 'Lean planning built for uptime and disciplined delivery.',
				},
			],
		},
		operations: {
			title: 'Core capabilities',
			items: [
				{
					title: 'Exploration and appraisal',
					text: 'Seismic and prospect work that improves drilling confidence.',
				},
				{
					title: 'Field development',
					text: 'Production planning and infrastructure coordination from discovery to delivery.',
				},
			],
		},
		impact: {
			title: 'Growth with discipline',
			text: 'Production growth is paired with risk control, safety, and responsible operations.',
			pillars: [
				'Safety-first operating culture',
				'Responsible resource development',
				'Local capability building',
			],
		},
		news: {
			kicker: 'News',
			title: 'Recent momentum',
			items: [
				{
					title: 'Hasirah Ridge discovery',
					text: 'A major Block 7 update highlighted the scale of the opportunity.',
				},
				{
					title: 'Starlink-enabled field connectivity',
					text: 'Improved field communications support faster coordination and remote support.',
				},
			],
		},
		contact: {
			title: 'Let’s start a serious conversation.',
			text: 'For partnerships or technical discussions, connect with Masar Petroleum directly.',
			phoneLabel: 'Phone',
			phone: '+968 2439 8600',
			linkedinLabel: 'LinkedIn',
			linkedin: 'https://www.linkedin.com/company/masarpetroleum/',
			locationLabel: 'Focus area',
			location: 'Block 7, Sahmah, Sultanate of Oman',
		},
		footer: 'Masar Petroleum, engineered for momentum.',
	},
	ar: {
		lang: 'ar',
		dir: 'rtl',
		label: 'العربية',
		switchHref: '/en/',
		switchLabel: 'EN',
		nav: [
			{ href: '/ar/about/', label: 'من نحن' },
			{ href: '/ar/operations/', label: 'العمليات' },
			{ href: '/ar/impact/', label: 'الأثر' },
			{ href: '/ar/news/', label: 'الأخبار' },
			{ href: '/ar/contact/', label: 'تواصل' },
		],
		hero: {
			eyebrow: 'شركة طاقة عُمانية',
			title: 'نقود نمواً مسؤولاً في الاستكشاف والإنتاج.',
			description: 'خبرة طاقة عُمانية مركزة، وتنفيذ منضبط، وزخم واضح.',
			primaryCta: { href: '/ar/operations/', label: 'استكشف العمليات' },
			secondaryCta: { href: '/ar/contact/', label: 'تواصل مع الفريق' },
			highlights: [
				'ملكية كاملة للبلوك 7 في صحمه، عُمان',
				'تعمل منذ عام 2015',
				'تنفيذ ميداني يبدأ بالسلامة',
			],
		},
		metrics: [
			{ value: '2015', label: 'انطلاق العمليات' },
			{ value: '100%', label: 'حصة العمل في البلوك 7' },
			{ value: '24/7', label: 'تنسيق فني وميداني' },
		],
		about: {
			title: 'مبنية للفصل القادم من الطاقة في عُمان.',
			text: 'تحول مسار بتروليوم الرؤية الجيولوجية إلى تنفيذ ميداني عملي.',
			cards: [
				{
					title: 'ذكاء باطني متقدم',
					text: 'جيوعلوم وتقييم مكامن يدعمان قرارات حفر أدق.',
				},
				{
					title: 'مرونة تشغيلية',
					text: 'تخطيط رشيق للاستمرارية والتنفيذ المنضبط.',
				},
			],
		},
		operations: {
			title: 'القدرات الأساسية',
			items: [
				{
					title: 'الاستكشاف والتقييم',
					text: 'عمل زلزالي وتقييم فرص يرفعان الثقة قبل الحفر.',
				},
				{
					title: 'تطوير الحقول',
					text: 'تخطيط إنتاج وتنسيق بنية تحتية من الاكتشاف إلى التسليم.',
				},
			],
		},
		impact: {
			title: 'نمو منضبط',
			text: 'نوازن بين نمو الإنتاج وإدارة المخاطر والسلامة والتشغيل المسؤول.',
			pillars: [
				'ثقافة تشغيلية تبدأ بالسلامة',
				'تطوير مسؤول للموارد',
				'بناء القدرات المحلية',
			],
		},
		news: {
			kicker: 'الأخبار',
			title: 'زخم حديث',
			items: [
				{
					title: 'اكتشاف هضبة حصيرة',
					text: 'تحديث مهم في البلوك 7 أكد حجم الفرصة المتاحة.',
				},
				{
					title: 'اتصال ميداني عبر ستارلينك',
					text: 'تحسين الاتصال الميداني يدعم التنسيق الأسرع والمساندة عن بُعد.',
				},
			],
		},
		contact: {
			title: 'لنبدأ حواراً جاداً.',
			text: 'للشراكات أو النقاشات الفنية، تواصل مباشرة مع مسار بتروليوم.',
			phoneLabel: 'الهاتف',
			phone: '+968 2439 8600',
			linkedinLabel: 'لينكدإن',
			linkedin: 'https://www.linkedin.com/company/masarpetroleum/',
			locationLabel: 'منطقة التركيز',
			location: 'البلوك 7، صحمه، سلطنة عُمان',
		},
		footer: 'مسار بتروليوم، هندسة تقود الزخم.',
	},
};