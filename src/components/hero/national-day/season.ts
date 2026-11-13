// Oman National Day (20 November). The home page hero flies the flag for the
// first three weeks of November, every year: from the 1st to the end of the 22nd.
//
// The site is static, so the date is checked in the visitor's browser, against
// the calendar in Muscat rather than the visitor's own time zone.
//
// To look at it out of season (or hide it in season), add `?national-day=on`
// or `?national-day=off` to the home page address.

const MONTH = 11;
const FIRST_DAY = 1;
const LAST_DAY = 22;

export function isNationalDaySeason(now: Date = new Date()): boolean {
	const preview = new URLSearchParams(window.location.search).get('national-day');
	if (preview === 'on') return true;
	if (preview === 'off') return false;

	let month = now.getMonth() + 1;
	let day = now.getDate();
	try {
		const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Muscat', month: 'numeric', day: 'numeric' }).formatToParts(now);
		month = Number(parts.find((part) => part.type === 'month')?.value) || month;
		day = Number(parts.find((part) => part.type === 'day')?.value) || day;
	} catch {
		// No time zone data: the visitor's own calendar is close enough.
	}
	return month === MONTH && day >= FIRST_DAY && day <= LAST_DAY;
}
