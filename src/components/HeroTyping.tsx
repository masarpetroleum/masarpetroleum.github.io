import { TypeAnimation } from 'react-type-animation';

type Props = {
	kicker: string;
	title: string;
	index: number;
	isRtl: boolean;
};

const slideDuration = 24000;
const slideOffset = 8000;
const kickerTypeTime = 1100;
const titleLeadDelay = 300;
const titleHoldTime = 4200;

export default function HeroTyping({ kicker, title, index, isRtl }: Props) {
	const initialDelay = index * slideOffset;
	const titleStartDelay = initialDelay + kickerTypeTime + titleLeadDelay;
	const cycleTailDelay = slideDuration - slideOffset - kickerTypeTime - titleLeadDelay - titleHoldTime;
	const direction = isRtl ? 'rtl' : 'ltr';

	return (
		<div dir={direction} className="hero-typing flex w-full max-w-full flex-col items-center gap-4 px-4 text-center">
			<TypeAnimation
				sequence={[initialDelay, kicker, 5200, '', slideDuration - 5200]}
				speed={60}
				repeat={Infinity}
				cursor={false}
				className={`block whitespace-nowrap text-[0.62rem] font-bold tracking-[0.5em] text-white/75 sm:text-[0.72rem] ${isRtl ? '' : 'uppercase'}`}
				style={{ direction, unicodeBidi: 'plaintext' }}
				wrapper="p"
			/>

			<h1
				dir={direction}
				className="whitespace-nowrap text-[clamp(1.15rem,4.2vw,2.6rem)] font-semibold leading-tight tracking-[-0.02em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
			>
				<TypeAnimation
					sequence={[titleStartDelay, title, titleHoldTime, '', cycleTailDelay]}
					speed={55}
					deletionSpeed={82}
					repeat={Infinity}
					cursor={true}
					className="hero-typing-title inline-block whitespace-nowrap"
					style={{ direction, unicodeBidi: 'plaintext' }}
					wrapper="span"
				/>
			</h1>
		</div>
	);
}
