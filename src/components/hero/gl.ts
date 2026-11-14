// The hero's WebGL layer (Three.js): draws the slide photos on one full-size
// plane and blends from one to the next in a fragment shader.
//
// The transition is a soft, uneven front that sweeps across the picture. Both
// photos slide and ripple as it passes, and the colour channels separate
// slightly at the front. A resting photo is shown as it is: no zoom, no movement.
//
// Loaded on demand by Hero.tsx, so Three.js is not part of the first download.
//
// Kept light, so it stays smooth on modest hardware:
// - A resting slide costs one texture read per pixel; the blend work is only
//   done while a blend is running, and drawing stops once the picture is still.
// - Each blend is timed. If frames come slowly, the canvas is drawn at a lower
//   resolution next time; if the lowest still isn't smooth, `onSlow` hands the
//   slideshow back to the plain CSS one (see global.css, "Hero").
// - Browsers that would draw WebGL in software are refused up front.
import {
	Camera,
	LinearFilter,
	Mesh,
	MirroredRepeatWrapping,
	NoColorSpace,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	Texture,
	TextureLoader,
	Vector2,
	WebGLRenderer,
} from 'three';

export interface HeroGL {
	/** Blend to a slide. `direction` is 1 for next, -1 for previous. */
	show(index: number, direction: 1 | -1): void;
	/** Stop drawing while the hero is off screen or the tab is hidden. */
	setActive(active: boolean): void;
	dispose(): void;
}

interface Options {
	/** The slide to start on. */
	index: number;
	/** Called once the first photo is on the canvas. */
	onReady(): void;
	/** Called if the browser takes the WebGL context away. */
	onLost(): void;
	/** Called when this computer can't draw the blends smoothly, even at the lowest quality. */
	onSlow(): void;
}

/** Where the quality that suited this computer is remembered between visits. */
export const QUALITY_KEY = 'masar-hero-quality';

/** Canvas pixels per CSS pixel, best first. */
const TIERS = [1.5, 1, 0.75];
/** A blend whose frames take longer than this on average (about 40 a second) is too slow. */
const SLOW_FRAME = 0.025;
/** The canvas is never asked to fill more pixels than this. */
const MAX_PIXELS = 2_400_000;

const remembered = () => {
	try {
		return window.localStorage.getItem(QUALITY_KEY);
	} catch {
		return null;
	}
};
const remember = (value: string) => {
	try {
		window.localStorage.setItem(QUALITY_KEY, value);
	} catch {
		// Private browsing: decide again next time.
	}
};

/** Seconds a blend takes. Keep in step with --hero-wipe in global.css. */
const DURATION = 1.6;

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	precision highp float;

	uniform sampler2D uFrom;
	uniform sampler2D uTo;
	uniform vec2 uFromSize;
	uniform vec2 uToSize;
	uniform vec2 uResolution;
	uniform float uProgress;
	uniform float uDirection;
	uniform float uTime;

	varying vec2 vUv;

	float hash(vec2 p) {
		p = fract(p * vec2(123.34, 456.21));
		p += dot(p, p + 45.32);
		return fract(p.x * p.y);
	}

	float noise(vec2 p) {
		vec2 i = floor(p);
		vec2 f = fract(p);
		vec2 u = f * f * (3.0 - 2.0 * f);
		return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
	}

	float fbm(vec2 p) {
		float value = 0.0;
		float amplitude = 0.5;
		for (int i = 0; i < 3; i++) {
			value += amplitude * noise(p);
			p *= 2.03;
			amplitude *= 0.5;
		}
		return value;
	}

	// Like CSS object-fit: cover.
	vec2 cover(vec2 uv, vec2 size) {
		float screen = uResolution.x / uResolution.y;
		float image = size.x / size.y;
		vec2 scale = screen > image ? vec2(1.0, image / screen) : vec2(screen / image, 1.0);
		return (uv - 0.5) * scale + 0.5;
	}

	// One photo, with its colour channels pulled apart along the direction of travel.
	vec3 photo(sampler2D map, vec2 uv, vec2 split) {
		return vec3(texture2D(map, uv + split).r, texture2D(map, uv).g, texture2D(map, uv - split).b);
	}

	void main() {
		float progress = uProgress;
		// A resting slide: just the photo. Everything below is for the blend.
		if (progress >= 1.0) {
			gl_FragColor = vec4(texture2D(uTo, cover(vUv, uToSize)).rgb, 1.0);
			return;
		}

		// Strongest in the middle of the blend, nothing at either end.
		float swell = sin(progress * 3.14159265);

		float n = fbm(vec2(vUv.x * uResolution.x / uResolution.y, vUv.y) * 2.2 + vec2(0.0, uTime * 0.04));

		// 0 at the edge the new slide comes in from, 1 at the far edge.
		float across = uDirection > 0.0 ? 1.0 - vUv.x : vUv.x;
		float front = progress * 1.5 - 0.25;
		float reveal = 1.0 - smoothstep(front - 0.2, front + 0.2, across + (n - 0.5) * 0.4);

		// Screen-space travel: the old photo leaves the way the new one is going.
		vec2 travel = vec2(-uDirection, 0.0);
		vec2 ripple = travel * swell * n * 0.1;
		vec2 split = travel * swell * 0.005;

		vec2 fromUv = cover(vUv - travel * progress * 0.22 - ripple, uFromSize);
		vec2 toUv = cover(vUv + travel * (1.0 - progress) * 0.22 + ripple, uToSize);

		// Away from the front only one photo shows, so only that one is read.
		vec3 color;
		if (reveal <= 0.0) color = texture2D(uFrom, fromUv).rgb;
		else if (reveal >= 1.0) color = texture2D(uTo, toUv).rgb;
		else color = mix(photo(uFrom, fromUv, split), photo(uTo, toUv, split), reveal);

		// A faint band of light rides the front.
		color += reveal * (1.0 - reveal) * swell * 0.35;

		gl_FragColor = vec4(color, 1.0);
	}
`;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Returns null when WebGL is not available; the caller keeps its CSS slideshow. */
export function createHeroGL(canvas: HTMLCanvasElement, images: string[], options: Options): HeroGL | null {
	let renderer: WebGLRenderer;
	try {
		// Refuse a software renderer: it would be slower than the CSS slideshow it replaces.
		renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, depth: false, failIfMajorPerformanceCaveat: true });
	} catch {
		return null;
	}
	// Some browsers hand out a software renderer anyway (no graphics driver, or
	// acceleration switched off). It can't keep up; leave the job to CSS.
	const context = renderer.getContext();
	const info = context.getExtension('WEBGL_debug_renderer_info');
	const gpu = info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
	if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) {
		renderer.dispose();
		return null;
	}
	// The photos are drawn as they are, with no colour conversion on the way in or out.
	renderer.outputColorSpace = 'srgb-linear';
	// Start at the quality that worked here last time.
	let quality = Math.min(window.devicePixelRatio || 1, Number(remembered()) || TIERS[0], TIERS[0]);

	const blank = new Texture();
	const uniforms = {
		uFrom: { value: blank },
		uTo: { value: blank },
		uFromSize: { value: new Vector2(1, 1) },
		uToSize: { value: new Vector2(1, 1) },
		uResolution: { value: new Vector2(1, 1) },
		uProgress: { value: 1 },
		uDirection: { value: 1 },
		uTime: { value: 0 },
	};
	const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, depthTest: false, depthWrite: false });
	const geometry = new PlaneGeometry(2, 2);
	const mesh = new Mesh(geometry, material);
	mesh.frustumCulled = false;
	const scene = new Scene();
	scene.add(mesh);
	const camera = new Camera();

	// Photos load once each, on first use.
	const loader = new TextureLoader();
	const textures: Array<Promise<Texture> | undefined> = [];
	const load = (index: number) =>
		(textures[index] ??= loader.loadAsync(images[index]).then((texture) => {
			texture.colorSpace = NoColorSpace;
			texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
			texture.minFilter = texture.magFilter = LinearFilter;
			texture.generateMipmaps = false;
			return texture;
		}));
	const sizeOf = (texture: Texture) => {
		const image = texture.image as { width: number; height: number };
		return new Vector2(image.width, image.height);
	};

	const now = () => performance.now() / 1000;
	let disposed = false;
	let active = true;
	let frame = 0;
	let current = -1;
	let wanted = options.index;
	let blendStart = -Infinity;

	const resize = () => {
		const { clientWidth: width, clientHeight: height } = canvas;
		if (!width || !height) return;
		renderer.setPixelRatio(Math.min(quality, Math.sqrt(MAX_PIXELS / (width * height))));
		renderer.setSize(width, height, false);
		uniforms.uResolution.value.set(width, height);
		// Resizing empties the canvas. Nothing is being drawn while a slide rests,
		// so put the picture back at once, before the browser shows the empty frame.
		if (current >= 0 && !disposed) renderer.render(scene, camera);
	};

	const observer = new ResizeObserver(resize);
	observer.observe(canvas);
	resize();

	// Timing of the blend in progress, to judge whether this computer keeps up.
	let lastFrame = 0;
	let blendFrames = 0;
	let blendTime = 0;
	const judge = () => {
		const average = blendFrames ? blendTime / blendFrames : 0;
		blendFrames = blendTime = 0;
		if (average <= SLOW_FRAME) return;
		const lower = TIERS.find((tier) => tier < quality - 0.01);
		if (lower) {
			quality = lower;
			remember(String(lower));
			resize();
		} else {
			remember('off');
			options.onSlow();
		}
	};

	const draw = () => {
		frame = 0;
		if (disposed || !active) return;
		const time = now();
		const progress = Math.min(1, (time - blendStart) / DURATION);
		if (progress < 1) {
			if (lastFrame) {
				blendTime += Math.min(0.5, time - lastFrame);
				blendFrames++;
			}
		} else if (blendFrames) {
			judge();
			if (disposed) return;
		}
		lastFrame = time;
		uniforms.uProgress.value = easeInOut(progress);
		uniforms.uTime.value = time;
		renderer.render(scene, camera);
		// A resting photo doesn't change: drawing stops until the next blend.
		if (progress < 1) frame = requestAnimationFrame(draw);
	};
	const start = () => {
		if (frame || !active || disposed || current < 0) return;
		lastFrame = 0;
		frame = requestAnimationFrame(draw);
	};

	async function show(index: number, direction: 1 | -1) {
		wanted = index;
		const texture = await load(index).catch(() => null);
		// Ignore a photo that failed, or one that was overtaken by a later request.
		if (!texture || disposed || wanted !== index || index === current) return;

		const first = current < 0;
		uniforms.uFrom.value = first ? texture : uniforms.uTo.value;
		uniforms.uFromSize.value = first ? sizeOf(texture) : uniforms.uToSize.value;
		uniforms.uTo.value = texture;
		uniforms.uToSize.value = sizeOf(texture);
		uniforms.uDirection.value = direction;
		blendStart = first ? -Infinity : now();
		current = index;
		start();
		if (first) requestAnimationFrame(() => !disposed && options.onReady());
	}

	const onLost = (event: Event) => {
		event.preventDefault();
		options.onLost();
	};
	canvas.addEventListener('webglcontextlost', onLost);

	void show(options.index, 1);
	// Have the other photos ready before they are needed.
	images.forEach((_, index) => void load(index).catch(() => null));

	return {
		show: (index, direction) => void show(index, direction),
		setActive(next) {
			active = next;
			if (active) start();
		},
		dispose() {
			disposed = true;
			cancelAnimationFrame(frame);
			observer.disconnect();
			canvas.removeEventListener('webglcontextlost', onLost);
			textures.forEach((texture) => void texture?.then((t) => t.dispose()).catch(() => null));
			geometry.dispose();
			material.dispose();
			renderer.dispose();
		},
	};
}
