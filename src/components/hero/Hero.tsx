// The home page hero: a full-bleed slideshow that follows the finger on touch
// screens. Built on Animate UI's carousel (Embla underneath) and icons.
import * as React from 'react';
import { motion, MotionConfig, useReducedMotion, type Variants } from 'motion/react';
import useEmblaCarousel, { CarouselCounter, CarouselDots } from '@animate-ui/react/primitives/carousel';
import { AnimateIcon } from '@animate-ui/react/icons';
import { ArrowRight } from '../animate-ui/icons/arrow-right';
import { ChevronLeft } from '../animate-ui/icons/chevron-left';
import { ChevronRight } from '../animate-ui/icons/chevron-right';
import { Pause } from '../animate-ui/icons/pause';
import { Play } from '../animate-ui/icons/play';

export interface HeroSlide {
	image: string;
	title: string;
	subtitle?: string;
	ctaLabel?: string;
	ctaHref?: string;
	/** 'light' marks a bright image, which gets a stronger shade behind the text. */
	theme?: 'light' | 'dark';
}

interface Props {
	slides: HeroSlide[];
	/** Seconds each slide stays before the next one. */
	interval: number;
}

const content: Variants = {
	hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
	shown: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

const line: Variants = {
	hidden: { opacity: 0, y: 28 },
	shown: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

// "More about us..." reads better without the dots next to an arrow.
const tidyLabel = (label: string) => label.replace(/\s*(\.{2,}|…)\s*$/, '');

export default function Hero({ slides, interval }: Props) {
	const count = slides.length;
	const reduceMotion = useReducedMotion();
	const [viewportRef, api] = useEmblaCarousel({ loop: count > 1, watchDrag: count > 1, duration: 32 });

	const [selected, setSelected] = React.useState(0);
	const [playing, setPlaying] = React.useState(true);
	const [hovered, setHovered] = React.useState(false);
	const [focused, setFocused] = React.useState(false);
	const [dragging, setDragging] = React.useState(false);

	// Don't start moving on its own for people who asked for less motion.
	React.useEffect(() => {
		if (reduceMotion) setPlaying(false);
	}, [reduceMotion]);

	React.useEffect(() => {
		if (!api) return;
		const onSelect = () => setSelected(api.selectedScrollSnap());
		const onDown = () => setDragging(true);
		const onUp = () => setDragging(false);
		onSelect();
		api.on('select', onSelect).on('reInit', onSelect).on('pointerDown', onDown).on('pointerUp', onUp);
		return () => {
			api.off('select', onSelect).off('reInit', onSelect).off('pointerDown', onDown).off('pointerUp', onUp);
		};
	}, [api]);

	const autoplay = playing && count > 1;
	const running = autoplay && !hovered && !focused && !dragging;

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowLeft') api?.scrollPrev();
		else if (e.key === 'ArrowRight') api?.scrollNext();
	};

	return (
		<MotionConfig reducedMotion="user">
			<section
				className="hero"
				data-slot="carousel"
				aria-roledescription="carousel"
				aria-label="Highlights"
				style={{ '--hero-interval': `${interval}s` } as React.CSSProperties}
				onKeyDown={onKeyDown}
				onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
				onPointerLeave={() => setHovered(false)}
				// Keyboard focus inside pauses the slideshow; a tap on a control does not.
				onFocus={(e) => (e.target as Element).matches(':focus-visible') && setFocused(true)}
				onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
			>
				<div className="hero-viewport" ref={viewportRef}>
					<div className="hero-track">
						{slides.map((slide, i) => {
							const active = i === selected;
							const Title = i === 0 ? 'h1' : 'p';
							return (
								<div
									key={i}
									className="hero-slide"
									data-theme={slide.theme ?? 'light'}
									data-active={active || undefined}
									role="group"
									aria-roledescription="slide"
									aria-label={`${i + 1} of ${count}`}
									inert={!active || undefined}
								>
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
									<div className="hero-shade" aria-hidden="true" />
									<div className="container hero-content">
										<motion.div className="hero-copy" variants={content} initial={false} animate={active ? 'shown' : 'hidden'}>
											<motion.div variants={line}>
												<Title className="hero-title">{slide.title}</Title>
											</motion.div>
											{slide.subtitle && (
												<motion.p className="hero-subtitle" variants={line}>
													{slide.subtitle}
												</motion.p>
											)}
											{slide.ctaHref && slide.ctaLabel && (
												<motion.div variants={line}>
													<AnimateIcon animateOnHover asChild>
														<a className="hero-cta" href={slide.ctaHref}>
															{tidyLabel(slide.ctaLabel)}
															<ArrowRight size={18} strokeWidth={2.4} />
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
				</div>

				{count > 1 && (
					<div className="container hero-controls">
						{api && (
							<>
								<CarouselCounter
									className="hero-counter"
									aria-live={running ? 'off' : 'polite'}
									format={(current, total) => (
										<>
											<span className="sr-only">Slide </span>
											{current}
											<span className="hero-counter-total">
												<span aria-hidden="true"> / </span>
												<span className="sr-only"> of </span>
												{total}
											</span>
										</>
									)}
								/>
								<CarouselDots className="hero-dots" />
							</>
						)}
						<div className="hero-buttons">
							<button type="button" className="hero-btn hero-step" aria-label="Previous slide" onClick={() => api?.scrollPrev()}>
								<ChevronLeft size={22} animateOnHover />
							</button>
							<button
								type="button"
								className="hero-btn"
								aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
								onClick={() => setPlaying((p) => !p)}
							>
								{/* The ring fills while a slide is showing; when it closes, the next slide comes in. */}
								<svg className="hero-ring" viewBox="0 0 48 48" aria-hidden="true">
									<circle className="hero-ring-track" cx="24" cy="24" r="22.5" />
									{autoplay && (
										<circle
											key={selected}
											className="hero-ring-progress"
											cx="24"
											cy="24"
											r="22.5"
											pathLength={1}
											style={{ animationPlayState: running ? 'running' : 'paused' }}
											onAnimationEnd={() => api?.scrollNext()}
										/>
									)}
								</svg>
								{playing ? <Pause size={18} /> : <Play size={18} />}
							</button>
							<button type="button" className="hero-btn hero-step" aria-label="Next slide" onClick={() => api?.scrollNext()}>
								<ChevronRight size={22} animateOnHover />
							</button>
						</div>
					</div>
				)}
			</section>
		</MotionConfig>
	);
}
