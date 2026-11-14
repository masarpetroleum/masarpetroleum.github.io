// Oman National Day on the home page hero: a small flag of Oman flying in the
// bottom left corner, with a short caption beside it. Shown from 1 to 22 November every
// year (see ./season.ts); the rest of the year this renders nothing and loads
// nothing.
//
// - The flag is drawn with WebGL (Three.js, see ./flag.ts).
// - Under "reduce motion" the flag is drawn once and stays still.
// - Without WebGL a flat picture of the flag takes its place.
// The styles are in global.css ("Hero: Oman National Day").
import * as React from 'react';
import { useReducedMotion } from 'motion/react';
import type { NationalDayGL } from './flag';
import { isNationalDaySeason } from './season';

const FLAG = '/images/site/oman-flag.webp';

interface Props {
	/** False while the hero is off screen or the tab is hidden. */
	active: boolean;
}

export default function NationalDay({ active }: Props) {
	const reduceMotion = useReducedMotion();
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const glRef = React.useRef<NationalDayGL | null>(null);
	// Decided in the browser, after the page is up: the built HTML is the same all year.
	const [season, setSeason] = React.useState(false);
	const [flag, setFlag] = React.useState<'loading' | 'gl' | 'flat'>('loading');

	React.useEffect(() => setSeason(isNationalDaySeason()), []);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!season || !canvas) return;
		let cancelled = false;
		import('./flag')
			.then(({ createNationalDayGL }) => {
				if (cancelled) return;
				glRef.current = createNationalDayGL(canvas, {
					flag: FLAG,
					animate: !reduceMotion,
					onReady: () => setFlag('gl'),
					onFail: () => setFlag('flat'),
				});
				if (!glRef.current) setFlag('flat');
			})
			.catch(() => !cancelled && setFlag('flat'));
		return () => {
			cancelled = true;
			glRef.current?.dispose();
			glRef.current = null;
			setFlag('loading');
		};
	}, [season, reduceMotion]);

	React.useEffect(() => {
		glRef.current?.setActive(active);
	}, [active, flag]);

	if (!season) return null;

	return (
		<div className="nd-wrap">
			<div className="nd" data-flag={flag}>
				<div className="nd-flag">
					<canvas ref={canvasRef} className="nd-canvas" aria-hidden="true" />
					{flag === 'flat' && <img className="nd-flat" src={FLAG} alt="" width={700} height={400} decoding="async" draggable={false} />}
				</div>
				<div className="nd-caption">
					<span className="nd-rule" aria-hidden="true">
						<i />
						<i />
						<i />
					</span>
					<p className="nd-ar" lang="ar" dir="rtl">
						اليوم الوطني العُماني
					</p>
					<p className="nd-en" lang="en" dir="ltr">
						Oman National Day
					</p>
				</div>
			</div>
		</div>
	);
}
