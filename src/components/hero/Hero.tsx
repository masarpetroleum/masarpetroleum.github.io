// The home page hero: a full-bleed slideshow.
//
// - The photos are drawn with WebGL (Three.js, see ./gl.ts): one blends into the
//   next through a rippling front. A resting photo stays perfectly still. The text rises
//   line by line from behind a mask. The styles are in global.css ("Hero").
// - Without WebGL, under "reduce motion", or on a computer that can't keep the
//   WebGL layer smooth, the slides are plain stacked images that cross-fade:
//   only opacity and transform change, which every graphics card does smoothly.
// - Swipe on touch screens, drag with a mouse, or use the arrow keys.
// - Moves on by itself every `interval` seconds; the buttons step and pause it.
// - From 1 to 22 November the flag of Oman flies in the bottom left corner, for Oman
//   National Day (see ./national-day/).
// - Pauses on hover, keyboard focus, when scrolled out of view and when the
//   browser tab is hidden. Does not start by itself under "reduce motion".
import * as React from 'react';
import { motion, MotionConfig, useReducedMotion, type Variants } from 'motion/react';
import { AnimateIcon } from '@animate-ui/react/icons';
import { ArrowRight } from '../animate-ui/icons/arrow-right';
import { ChevronLeft } from '../animate-ui/icons/chevron-left';
import { ChevronRight } from '../animate-ui/icons/chevron-right';
import { Pause } from '../animate-ui/icons/pause';
import { Play } from '../animate-ui/icons/play';
import type { HeroGL } from './gl';

/** Kept in step with QUALITY_KEY in ./gl.ts, which is only loaded when WebGL is going to be used. */
const QUALITY_KEY = 'masar-hero-quality';

/** A computer that is better off with the plain slideshow: it said so last time, or it is clearly modest. */
function prefersLite() {
	try {
		if (window.localStorage.getItem(QUALITY_KEY) === 'off') return true;
	} catch {
		// No storage: fall through to the hardware hints.
	}
	const { hardwareConcurrency, deviceMemory } = navigator as Navigator & { deviceMemory?: number };
	return (hardwareConcurrency ?? 8) <= 2 || (deviceMemory ?? 8) <= 2;
}
import NationalDay from './national-day/NationalDay';

export interface HeroSlide {
	image: string;
	title: string;
	subtitle?: string;
	ctaLabel?: string;
	ctaHref?: string;
	/** 'light' marks a bright image, which gets a stronger shade behind the text. */
	theme?: 'light' | 'dark';
}

export interface HeroLabels {
	carousel: string;
	/** "{i} of {n}" */
	slideOf: string;
	previous: string;
	next: string;
	pause: string;
	play: string;
}

interface Props {
	slides: HeroSlide[];
	/** Seconds each slide stays before the next one. */
	interval: number;
	/** Right-to-left page (Arabic): "next" is towards the left, so swipes and arrow keys swap. */
	rtl?: boolean;
	labels: HeroLabels;
}

/** A swipe must travel this far, and mostly sideways, to change the slide. */
const SWIPE_DISTANCE = 48;

const copy: Variants = {
	// Reset out of sight, after the incoming slide has covered this one.
	hidden: { transition: { staggerChildren: 0, delayChildren: 1.1 } },
	shown: { transition: { staggerChildren: 0.11, delayChildren: 0.5 } },
};

/** Text rises from behind its mask. */
const rise: Variants = {
	hidden: { y: '115%', transition: { duration: 0.01 } },
	shown: { y: '0%', transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] } },
};

const fade: Variants = {
	hidden: { opacity: 0, y: 16, transition: { duration: 0.01 } },
	shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero({ slides, interval, rtl = false, labels }: Props) {
	const count = slides.length;
	const many = count > 1;
	const reduceMotion = useReducedMotion();

	const rootRef = React.useRef<HTMLElement>(null);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const glRef = React.useRef<HeroGL | null>(null);
	// True once the WebGL layer has drawn its first photo and takes over from the images.
	const [gl, setGl] = React.useState(false);
	// True on computers that can't run the WebGL layer smoothly: the CSS slideshow is used, and stays.
	const [lite, setLite] = React.useState(false);
	// `from` is the slide being covered; `direction` is 1 for next, -1 for previous.
	const [view, setView] = React.useState<{ index: number; from: number | null; direction: 1 | -1 }>({ index: 0, from: null, direction: 1 });
	const [playing, setPlaying] = React.useState(true);
	const [hovered, setHovered] = React.useState(false);
	const [focused, setFocused] = React.useState(false);
	const [onScreen, setOnScreen] = React.useState(true);
	const [tabVisible, setTabVisible] = React.useState(true);

	const go = React.useCallback(
		(target: number, direction?: 1 | -1) =>
			setView((current) => {
				const index = ((target % count) + count) % count;
				if (index === current.index) return current;
				return { index, from: current.index, direction: direction ?? (index > current.index ? 1 : -1) };
			}),
		[count],
	);
	const next = React.useCallback(() => go(view.index + 1, 1), [go, view.index]);
	const previous = React.useCallback(() => go(view.index - 1, -1), [go, view.index]);

	// Don't start moving on its own for people who asked for less motion.
	React.useEffect(() => {
		if (reduceMotion) setPlaying(false);
	}, [reduceMotion]);

	// Only run the timer while the slideshow can be seen.
	React.useEffect(() => {
		const root = rootRef.current;
		if (!root || !('IntersectionObserver' in window)) return;
		const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 });
		observer.observe(root);
		const onVisibility = () => setTabVisible(!document.hidden);
		onVisibility();
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			observer.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
		};
	}, []);

	// The WebGL layer. Three.js is fetched here, after the page is up, and only
	// for visitors who haven't asked for less motion.
	const images = slides.map((slide) => slide.image).join('\n');
	const viewRef = React.useRef(view);
	viewRef.current = view;
	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || reduceMotion || lite) return;
		if (prefersLite()) {
			setLite(true);
			return;
		}
		let cancelled = false;
		import('./gl')
			.then(({ createHeroGL }) => {
				if (cancelled) return;
				glRef.current = createHeroGL(canvas, images.split('\n'), {
					index: viewRef.current.index,
					onReady: () => setGl(true),
					onLost: () => setGl(false),
					onSlow: () => setLite(true),
				});
				// No hardware-accelerated WebGL here.
				if (!glRef.current) setLite(true);
			})
			.catch(() => {
				// The stacked images keep working as the slideshow.
			});
		return () => {
			cancelled = true;
			glRef.current?.dispose();
			glRef.current = null;
			setGl(false);
		};
	}, [images, reduceMotion, lite]);

	React.useEffect(() => {
		// On a right-to-left page the next slide arrives from the left.
		glRef.current?.show(view.index, (rtl ? -view.direction : view.direction) as 1 | -1);
	}, [view, rtl]);

	React.useEffect(() => {
		glRef.current?.setActive(onScreen && tabVisible);
	}, [onScreen, tabVisible, gl]);

	const running = playing && many && !hovered && !focused && onScreen && tabVisible;

	// The timer. A pause keeps the time already spent on the slide, so the slide
	// doesn't start its wait again after every hover.
	const remaining = React.useRef(interval * 1000);
	React.useEffect(() => {
		remaining.current = interval * 1000;
	}, [view.index, interval]);
	React.useEffect(() => {
		if (!running) return;
		const started = performance.now();
		const timer = window.setTimeout(next, remaining.current);
		return () => {
			window.clearTimeout(timer);
			remaining.current = Math.max(0, remaining.current - (performance.now() - started));
		};
	}, [running, view.index, next]);

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowLeft') (rtl ? next : previous)();
		else if (e.key === 'ArrowRight') (rtl ? previous : next)();
		else if (e.key === 'Home') go(0, -1);
		else if (e.key === 'End') go(count - 1, 1);
		else return;
		e.preventDefault();
	};

	// Swipe (touch) and drag (mouse): a sideways gesture changes the slide.
	const gesture = React.useRef<{ x: number; y: number; swiped: boolean } | null>(null);
	const onPointerDown = (e: React.PointerEvent) => {
		if (!many || (e.pointerType === 'mouse' && e.button !== 0)) return;
		if ((e.target as Element).closest('.hero-ui')) return;
		gesture.current = { x: e.clientX, y: e.clientY, swiped: false };
	};
	const onPointerUp = (e: React.PointerEvent) => {
		const start = gesture.current;
		if (!start) return;
		const dx = e.clientX - start.x;
		const dy = e.clientY - start.y;
		if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.2) {
			start.swiped = true;
			// The next slide comes in from the far side: swipe towards the near side to pull it in.
			if (dx < 0 !== rtl) next();
			else previous();
		}
	};
	// A drag that ends on the button must not also follow its link.
	const onClickCapture = (e: React.MouseEvent) => {
		if (gesture.current?.swiped) {
			e.preventDefault();
			e.stopPropagation();
		}
		gesture.current = null;
	};

	return (
		<MotionConfig reducedMotion="user">
			<section
				ref={rootRef}
				className="hero"
				aria-roledescription="carousel"
				aria-label={labels.carousel}
				data-direction={rtl ? -view.direction : view.direction}
				data-gl={gl || undefined}
				onKeyDown={onKeyDown}
				onPointerDown={onPointerDown}
				onPointerUp={onPointerUp}
				onPointerCancel={() => (gesture.current = null)}
				onClickCapture={onClickCapture}
				onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
				onPointerLeave={() => setHovered(false)}
				// Keyboard focus inside pauses the slideshow; a tap on a control does not.
				onFocus={(e) => (e.target as Element).matches(':focus-visible') && setFocused(true)}
				onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
			>
				<div className="hero-stage" aria-live={running ? 'off' : 'polite'}>
					<canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
					{slides.map((slide, i) => {
						const active = i === view.index;
						// 'enter' plays the curtain; the very first slide is simply there.
						const state = active ? (view.from === null ? 'start' : 'enter') : i === view.from ? 'leave' : undefined;
						const Title = i === 0 ? 'h1' : 'p';
						return (
							<div
								key={i}
								className="hero-slide"
								data-theme={slide.theme ?? 'light'}
								data-state={state}
								role="group"
								aria-roledescription="slide"
								aria-label={`${labels.slideOf.replace('{i}', String(i + 1)).replace('{n}', String(count))}: ${slide.title}`}
								inert={!active || undefined}
							>
								<div className="hero-media">
									<img
										className="hero-photo"
										src={slide.image}
										alt=""
										width={2200}
										height={880}
										loading="eager"
										fetchPriority={i === 0 ? 'high' : 'low'}
										decoding={i === 0 ? 'auto' : 'async'}
										draggable={false}
									/>
								</div>
								<div className="hero-shade" aria-hidden="true" />
								<div className="container hero-content">
									<motion.div className="hero-copy" variants={copy} initial={false} animate={active ? 'shown' : 'hidden'}>
										<div className="hero-mask">
											<motion.div variants={rise}>
												<Title className="hero-title">{slide.title}</Title>
											</motion.div>
										</div>
										{slide.subtitle && (
											<div className="hero-mask">
												<motion.p className="hero-subtitle" variants={rise}>
													{slide.subtitle}
												</motion.p>
											</div>
										)}
										{slide.ctaHref && slide.ctaLabel && (
											<motion.div variants={fade}>
												<AnimateIcon animateOnHover asChild>
													<a className="hero-cta" href={slide.ctaHref} draggable={false}>
														{slide.ctaLabel}
														<ArrowRight className="flip-rtl" size={18} strokeWidth={2.4} />
													</a>
												</AnimateIcon>
											</motion.div>
										)}
									</motion.div>
								</div>
							</div>
						);
					})}
				</div>

				<NationalDay active={onScreen && tabVisible} lite={lite} />

				{many && (
					<div className="container hero-ui">
						<div className="hero-buttons">
							<button type="button" className="hero-btn hero-step" aria-label={labels.previous} onClick={previous}>
								<ChevronLeft className="flip-rtl" size={22} animateOnHover />
							</button>
							<button
								type="button"
								className="hero-btn"
								aria-label={playing ? labels.pause : labels.play}
								aria-pressed={!playing}
								onClick={() => setPlaying((p) => !p)}
							>
								{playing ? <Pause size={18} /> : <Play size={18} />}
							</button>
							<button type="button" className="hero-btn hero-step" aria-label={labels.next} onClick={next}>
								<ChevronRight className="flip-rtl" size={22} animateOnHover />
							</button>
						</div>
					</div>
				)}
			</section>
		</MotionConfig>
	);
}
