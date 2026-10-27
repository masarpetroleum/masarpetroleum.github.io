export const SITE = {
	name: 'Masar Petroleum',
	title: 'Masar petroleum | Oil & Gas Exploration in Oman',
	description:
		'Masar Petroleum SAOC is an innovative oil and gas exploration and production company founded in 2015. With a strategic focus on unlocking hydrocarbon resources, Masar Petroleum owns 100% of Block 7 in Sahmah and partners with S&T to enhance operational capabilities. Committed to safety, environmental stewardship, and global energy security, we aim to create long-term value and positively impact communities.',
	keywords:
		'oil drilling, Oman oil industry, oil exploration, oil production, Oman drilling services, offshore drilling Oman, oil and gas, petroleum exploration, energy sector Oman, drilling technology, oil services Oman, oil field development, oil reserves Oman, energy solutions Oman, oil drilling equipment, petroleum company Oman',
	ogImage: '/template/logo-og.png',
	gaId: 'G-CKVK97VQ88',
};

export const CONTACT = {
	company: 'Masar Petroleum',
	address: ['Coral Building, Next to Zakher Mall, Al Khuwair,', 'Muscat, Oman'],
	phone: '+968 24398600',
	phoneHref: 'tel:+96824398600',
	email: 'info@masarpetroleum.om',
	linkedin: 'https://www.linkedin.com/company/masarpetroleum/',
	jsrs: 'https://businessgateways.com/jsrs/',
	mapEmbed:
		'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.267496199289!2d58.43999857601969!3d23.594737694733254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e91ff3d2f03f6a1%3A0xcfb802c6409280e9!2sCoral%20Building%2C%20Muscat!5e0!3m2!1sen!2som!4v1727610461459!5m2!1sen!2som',
	careerLinks: [
		{ label: 'Our station at petroJobs Oman', href: 'https://www.petrojobs.om/en-us/Pages/Job/operator-jobs.aspx?opid=28' },
		{ label: 'Zoho Recruit', href: 'https://hcfoman.zohorecruit.com/jobs/Careers/' },
	],
};

export interface NavItem {
	href: string;
	label: string;
	children?: Array<{ href: string; label: string }>;
}

export const NAV: NavItem[] = [
	{ href: '/', label: 'Home' },
	{
		href: '/about/',
		label: 'About',
		children: [
			{ href: '/company/', label: 'Company background' },
			{ href: '/team/', label: 'Our Team' },
		],
	},
	{ href: '/operations/', label: 'Operations' },
	{ href: '/careers/', label: 'Careers' },
	{ href: '/events/', label: 'Events' },
	{ href: '/articles/', label: 'Articles' },
	{ href: '/contact/', label: 'Contact' },
];

/** Homepage billboard slides, in display order. */
export const SLIDES = [
	{ image: '/images/billboard/6.jpg', title: 'Masar Petroleum', subtitle: 'Paving the way for energy', cta: { href: '/about/', label: 'More about us...' }, theme: 'light' },
	{ image: '/images/billboard/7.jpg', title: 'Masar', subtitle: 'Powering the Future, Shaping the Way', theme: 'dark' },
	{ image: '/images/billboard/8.jpg', title: 'Our Mission', subtitle: 'Forging New Paths in Oil and Gas!', theme: 'light' },
] as const;

/** The three pinned value cards on the homepage parallax band. */
export const VALUES = [
	{ image: '/images/fixedbg/2.png', title: 'Innovating to Power Tomorrow', text: 'Innovative methods and technologies to meet energy demands sustainably.' },
	{ image: '/images/fixedbg/3.png', title: 'Maximizing Resources, Minimizing Impact.', text: 'Strategic focus on responsibly unlocking hydrocarbon resources, with an eye on sustainability and environmental stewardship.' },
	{ image: '/images/fixedbg/4.png', title: 'Fueling Economies, Creating Opportunities', text: 'Driving economic growth and its commitment to stakeholder and community development' },
];

/** "Recent News" on the homepage and /news/, by legacy id, newest first. */
export const RECENT_NEWS = [31, 29, 26, 5, 1];
