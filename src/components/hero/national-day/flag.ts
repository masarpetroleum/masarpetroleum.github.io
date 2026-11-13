// The Oman National Day scene (Three.js): the flag of Oman flying from a slim
// gold pole, with a little gold dust drifting past.
//
// - The flag is a finely divided plane. A vertex shader bends it into travelling
//   waves that grow from the pole to the free end, and works out the surface
//   direction of every point so the folds catch the light like silk.
// - When it first appears the flag is hoisted up the pole.
// - The whole scene leans a few degrees towards the mouse.
//
// It is drawn on its own transparent canvas, over the hero photos. The scene is
// 4 units wide and 2.8 high; global.css gives the canvas the same 10:7 shape. Loaded on demand, and only in season (see ./season.ts).
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	CylinderGeometry,
	DoubleSide,
	Group,
	LinearFilter,
	LinearMipmapLinearFilter,
	Mesh,
	NoColorSpace,
	PerspectiveCamera,
	PlaneGeometry,
	Points,
	Scene,
	ShaderMaterial,
	SphereGeometry,
	Texture,
	TextureLoader,
	Vector2,
	WebGLRenderer,
} from 'three';

export interface NationalDayGL {
	/** Stop drawing while the hero is off screen or the tab is hidden. */
	setActive(active: boolean): void;
	dispose(): void;
}

interface Options {
	/** Address of the flag picture (7:4). */
	flag: string;
	/** False under "reduce motion": the flag is drawn once, mid-wave, and stays still. */
	animate: boolean;
	/** Called once the flag is on the canvas. */
	onReady(): void;
	/** Called if the flag can't be shown (picture failed, or WebGL was taken away). */
	onFail(): void;
}

// Scene measurements, in scene units.
const VIEW_WIDTH = 4;
const VIEW_HEIGHT = 2.8;
const FOV = 28;
const FLAG_WIDTH = 3.05;
const FLAG_HEIGHT = (FLAG_WIDTH * 4) / 7;
const FLAG_TOP = 1.0;
const POLE_X = -1.5;
const POLE_RADIUS = 0.03;
const POLE_TOP = FLAG_TOP + 0.1;
const POLE_BOTTOM = -1.5;
/** How far below its place the flag starts before it is hoisted, and for how long. */
const HOIST_DISTANCE = 0.42;
const HOIST_SECONDS = 2.6;
const DUST = 26;

const flagVertex = /* glsl */ `
	uniform float uTime;
	uniform float uWind;
	uniform vec2 uSize;

	varying vec2 vUv;
	varying vec3 vNormal;
	varying vec3 vView;

	// Where a point of the flat flag ends up. p.x runs from the pole (0) to the
	// free end, p.y from the top edge (0) down.
	vec3 cloth(vec2 p) {
		float along = p.x / uSize.x;
		// Held at the pole, freer towards the far end.
		float free = smoothstep(0.0, 0.3, along) * (0.4 + 0.6 * along);
		float wave =
			sin(p.x * 2.4 - uTime * 2.6 + p.y * 0.8) * 0.25 +
			sin(p.x * 4.1 - uTime * 3.7 - p.y * 1.6 + 1.3) * 0.1 +
			sin(p.x * 7.3 - uTime * 5.2 + p.y * 2.7 + 0.6) * 0.032;
		float sag = along * along * 0.12 * (1.3 - uWind * 0.5);
		float flutter = sin(p.x * 1.9 - uTime * 2.1) * 0.035 * free * uWind;
		return vec3(p.x - free * along * 0.06 * uWind, p.y - sag + flutter, wave * free * uWind);
	}

	void main() {
		vUv = uv;
		vec3 point = cloth(position.xy);
		// The surface direction, from two nearby points.
		float step = 0.012;
		vec3 alongX = cloth(position.xy + vec2(step, 0.0)) - point;
		vec3 alongY = cloth(position.xy + vec2(0.0, step)) - point;
		vNormal = normalMatrix * normalize(cross(alongX, alongY));
		vec4 viewPoint = modelViewMatrix * vec4(point, 1.0);
		vView = -viewPoint.xyz;
		gl_Position = projectionMatrix * viewPoint;
	}
`;

const flagFragment = /* glsl */ `
	precision highp float;

	uniform sampler2D uMap;

	varying vec2 vUv;
	varying vec3 vNormal;
	varying vec3 vView;

	void main() {
		vec3 normal = normalize(vNormal);
		if (!gl_FrontFacing) normal = -normal;
		vec3 view = normalize(vView);
		vec3 light = normalize(vec3(-0.45, 0.6, 0.75));

		// Soft light that wraps round the folds, a silky highlight, and a faint edge glow.
		float wrap = dot(normal, light) * 0.5 + 0.5;
		float shade = mix(0.36, 1.08, pow(wrap, 1.35));
		float sheen = pow(max(dot(normal, normalize(light + view)), 0.0), 26.0) * 0.2;
		float rim = pow(1.0 - max(dot(normal, view), 0.0), 3.0) * 0.08;

		vec3 color = texture2D(uMap, vUv).rgb * shade + sheen + rim;
		if (!gl_FrontFacing) color *= 0.84;
		gl_FragColor = vec4(min(color, 1.0), 1.0);
	}
`;

// The pole and the ball on top: brushed gold, fading out towards the bottom.
const metalVertex = /* glsl */ `
	varying vec3 vNormal;
	varying float vHeight;
	void main() {
		vNormal = normalMatrix * normal;
		vec4 world = modelMatrix * vec4(position, 1.0);
		vHeight = world.y;
		gl_Position = projectionMatrix * viewMatrix * world;
	}
`;

const metalFragment = /* glsl */ `
	precision highp float;

	uniform vec2 uFade;

	varying vec3 vNormal;
	varying float vHeight;

	void main() {
		vec3 normal = normalize(vNormal);
		float across = normal.x;
		vec3 dark = vec3(0.27, 0.21, 0.11);
		vec3 gold = vec3(0.8, 0.67, 0.4);
		vec3 bright = vec3(1.0, 0.96, 0.82);
		float body = smoothstep(-1.0, 0.0, across) * (1.0 - smoothstep(0.3, 1.0, across) * 0.7);
		vec3 color = mix(dark, gold, body);
		// One narrow streak of light, left of centre and a little above.
		float streak = max(0.0, 1.0 - length(vec2(across + 0.3, (normal.y - 0.35) * 0.6)) * 1.9);
		color = mix(color, bright, pow(streak, 5.0));
		gl_FragColor = vec4(color, smoothstep(uFade.x, uFade.y, vHeight));
	}
`;

const dustVertex = /* glsl */ `
	attribute vec4 aSeed;

	uniform float uTime;
	uniform float uPixels;

	varying float vGlow;

	void main() {
		vec3 point = position;
		// Rise slowly, wrap round at the top, and sway.
		point.y = mod(point.y + 1.4 + uTime * (0.04 + aSeed.w * 0.07), 2.8) - 1.4;
		point.x += sin(uTime * 0.4 + aSeed.x * 6.283) * 0.14;
		vec4 viewPoint = modelViewMatrix * vec4(point, 1.0);
		gl_Position = projectionMatrix * viewPoint;
		gl_PointSize = uPixels * (0.08 + 0.14 * aSeed.y);
		float twinkle = sin(uTime * (0.7 + aSeed.z * 1.6) + aSeed.w * 6.283);
		// Fade out towards the edges of the scene, so nothing is cut off.
		float inside = smoothstep(1.38, 0.9, abs(point.y)) * smoothstep(1.95, 1.4, abs(point.x));
		vGlow = (0.25 + 0.75 * twinkle * twinkle) * inside;
	}
`;

const dustFragment = /* glsl */ `
	precision highp float;

	varying float vGlow;

	void main() {
		float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
		// Added to whatever is behind: light only, no cover.
		gl_FragColor = vec4(vec3(1.0, 0.86, 0.56) * glow * glow * vGlow * 0.5, 0.0);
	}
`;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Returns null when WebGL is not available; the caller shows a flat flag instead. */
export function createNationalDayGL(canvas: HTMLCanvasElement, options: Options): NationalDayGL | null {
	let renderer: WebGLRenderer;
	try {
		renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
	} catch {
		return null;
	}
	// The flag's colours are drawn as they are, with no colour conversion on the way in or out.
	renderer.outputColorSpace = 'srgb-linear';
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setClearColor(0x000000, 0);

	const scene = new Scene();
	const camera = new PerspectiveCamera(FOV, VIEW_WIDTH / VIEW_HEIGHT, 0.1, 60);
	// From here the camera sees exactly VIEW_HEIGHT units at the flag's distance.
	const distance = VIEW_HEIGHT / 2 / Math.tan((FOV * Math.PI) / 360);

	// Everything hangs from `stage`, which leans towards the mouse.
	const stage = new Group();
	scene.add(stage);

	const metal = new ShaderMaterial({
		uniforms: { uFade: { value: new Vector2(POLE_BOTTOM + 0.12, POLE_BOTTOM + 0.75) } },
		vertexShader: metalVertex,
		fragmentShader: metalFragment,
		transparent: true,
	});
	const poleGeometry = new CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_TOP - POLE_BOTTOM, 20, 1, true);
	const pole = new Mesh(poleGeometry, metal);
	pole.position.set(POLE_X, (POLE_TOP + POLE_BOTTOM) / 2, 0);
	const ballGeometry = new SphereGeometry(POLE_RADIUS * 2.5, 28, 20);
	const ball = new Mesh(ballGeometry, metal);
	ball.position.set(POLE_X, POLE_TOP + POLE_RADIUS * 1.6, 0);
	stage.add(pole, ball);

	const flagUniforms = {
		uMap: { value: new Texture() },
		uTime: { value: 1.7 },
		uWind: { value: 1 },
		uSize: { value: new Vector2(FLAG_WIDTH, FLAG_HEIGHT) },
	};
	const flagMaterial = new ShaderMaterial({ uniforms: flagUniforms, vertexShader: flagVertex, fragmentShader: flagFragment, side: DoubleSide });
	const flagGeometry = new PlaneGeometry(FLAG_WIDTH, FLAG_HEIGHT, 140, 80);
	// Top-left corner at the origin: x runs along the flag, y down from the top edge.
	flagGeometry.translate(FLAG_WIDTH / 2, -FLAG_HEIGHT / 2, 0);
	const flag = new Mesh(flagGeometry, flagMaterial);
	flag.frustumCulled = false;
	flag.position.set(POLE_X + POLE_RADIUS, FLAG_TOP, 0);
	// The free end swings a little away from the viewer, which gives the flag depth.
	flag.rotation.y = 0.36;
	flag.visible = false;
	stage.add(flag);

	const dustGeometry = new BufferGeometry();
	const positions = new Float32Array(DUST * 3);
	const seeds = new Float32Array(DUST * 4);
	for (let i = 0; i < DUST; i++) {
		positions[i * 3] = (Math.random() - 0.5) * VIEW_WIDTH;
		positions[i * 3 + 1] = (Math.random() - 0.5) * VIEW_HEIGHT;
		// Behind the flag, so it never speckles the cloth.
		positions[i * 3 + 2] = -1.5 - Math.random() * 1.5;
		for (let j = 0; j < 4; j++) seeds[i * 4 + j] = Math.random();
	}
	dustGeometry.setAttribute('position', new BufferAttribute(positions, 3));
	dustGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 4));
	const dustUniforms = { uTime: { value: 0 }, uPixels: { value: 100 } };
	const dustMaterial = new ShaderMaterial({
		uniforms: dustUniforms,
		vertexShader: dustVertex,
		fragmentShader: dustFragment,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		premultipliedAlpha: true,
	});
	const dust = new Points(dustGeometry, dustMaterial);
	dust.frustumCulled = false;
	stage.add(dust);

	let disposed = false;
	let active = true;
	let ready = false;
	let frame = 0;
	let last = 0;
	// Seconds of animation shown so far; it does not run while paused.
	let clock = 0;
	const mouse = new Vector2(0, 0);
	const lean = new Vector2(0, 0);

	const render = () => {
		const hoist = options.animate ? 1 - easeOut(Math.min(1, clock / HOIST_SECONDS)) : 0;
		flag.position.y = FLAG_TOP - hoist * HOIST_DISTANCE;
		// The wind comes in slow gusts, and is a little stronger while the flag goes up.
		flagUniforms.uWind.value = 0.9 + 0.16 * Math.sin(clock * 0.43) + 0.07 * Math.sin(clock * 1.1 + 1) + hoist * 0.25;
		flagUniforms.uTime.value = 1.7 + clock;
		dustUniforms.uTime.value = clock;
		lean.lerp(mouse, 0.04);
		stage.rotation.y = lean.x * 0.12;
		stage.rotation.x = -lean.y * 0.05;
		renderer.render(scene, camera);
	};

	const tick = (time: number) => {
		frame = 0;
		if (disposed || !active) return;
		clock += Math.min(0.05, (time - last) / 1000);
		last = time;
		render();
		frame = requestAnimationFrame(tick);
	};
	const start = () => {
		if (!ready || disposed) return;
		if (!options.animate) return render();
		if (frame || !active) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	};

	const resize = () => {
		const { clientWidth: width, clientHeight: height } = canvas;
		if (!width || !height) return;
		renderer.setSize(width, height, false);
		const aspect = width / height;
		camera.aspect = aspect;
		// Step back if the canvas is narrower than the scene, so the flag always fits.
		camera.position.z = distance * Math.max(1, VIEW_WIDTH / VIEW_HEIGHT / aspect);
		camera.updateProjectionMatrix();
		dustUniforms.uPixels.value = (height * renderer.getPixelRatio()) / VIEW_HEIGHT;
		if (ready && !options.animate) render();
	};
	const observer = new ResizeObserver(resize);
	observer.observe(canvas);
	resize();

	const onPointerMove = (event: PointerEvent) => {
		if (event.pointerType !== 'mouse') return;
		mouse.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
	};
	if (options.animate) window.addEventListener('pointermove', onPointerMove, { passive: true });

	const onLost = (event: Event) => {
		event.preventDefault();
		options.onFail();
	};
	canvas.addEventListener('webglcontextlost', onLost);

	new TextureLoader().load(
		options.flag,
		(texture) => {
			if (disposed) return texture.dispose();
			texture.colorSpace = NoColorSpace;
			texture.minFilter = LinearMipmapLinearFilter;
			texture.magFilter = LinearFilter;
			texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
			flagUniforms.uMap.value = texture;
			flag.visible = true;
			ready = true;
			start();
			requestAnimationFrame(() => !disposed && options.onReady());
		},
		undefined,
		() => !disposed && options.onFail(),
	);

	return {
		setActive(next) {
			active = next;
			if (active) start();
		},
		dispose() {
			disposed = true;
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('webglcontextlost', onLost);
			flagUniforms.uMap.value.dispose();
			[poleGeometry, ballGeometry, flagGeometry, dustGeometry].forEach((geometry) => geometry.dispose());
			[metal, flagMaterial, dustMaterial].forEach((material) => material.dispose());
			renderer.dispose();
		},
	};
}
