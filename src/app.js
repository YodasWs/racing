/* app.json */
const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;
const z = 2;
const strokeWidth = 1;

const TrackPiece = require('../src/js/TrackPiece');
const RaceTrack = require('../src/js/RaceTrack');
const Car = require('../src/js/Car');

yodasws.page('home').setRoute({
	template: 'pages/home.html',
	route: '/',
}).on('load', () => {
	const svg = document.querySelector('svg#scene');

	document.getElementById('btnTick').remove();

	const btn = document.createElement('button');
	btn.innerText = 'Flag!';
	btn.addEventListener('click', (e) => {
		e.preventDefault();
		console.error('Sam, flag!');
	});
	document.querySelector('form').appendChild(btn);

	let raceTrack = new RaceTrack(svg, [
		new Car('Alice, TX', {
			color: 'lightgreen',
			color2: 'orange',
			rgb: [0x90, 0xee, 0x90],
		}),
		new Car('Brooklyn, NY', {
			color: 'white',
			color2: 'black',
			r: 3,
			strokeWidth: 3,
			rgb: [0x44, 0x44, 0x44],
		}),
		new Car('Charlotte, NC', {
			color: '#249E57',
			color2: 'lightgrey',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0x24, 0x9E, 0x57],
		}),
		new Car('Dallas, TX', {
			color: 'red',
			color2: '#000191',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0, 0x01, 0x91],
		}),
		new Car('Edison, NJ', {
			color: 'white',
			color2: '#00375D',
			r: 3,
			strokeWidth: 3,
			rgb: [0x30, 0x67, 0x8D],
		}),
		new Car('Florence, TN', {
			color: '#1E3258',
			color2: '#BF1F2D',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xBF, 0x1F, 0x2D],
		}),
		new Car('Garland, TX', {
			color: '#E61234',
			color2: '#FDB920',
			r: 3,
			strokeWidth: 3,
			rgb: [0xFD, 0xB9, 0x20],
		}),
		new Car('Helena, AL', {
			color: 'white',
			color2: '#A49C44',
			r: 3,
			strokeWidth: 3,
			rgb: [0xB4, 0x9C, 0x26],
		}),
	].sort(() => 0 && Math.sign(Math.random() * 2 - 1)), Object.assign({}, json.cSuzuka, {
		laps: 10,
	}));

	raceTrack.simulation.stop();
	raceTrack.init();
	buildReplay(raceTrack);

	document.getElementById('btnStart').focus();
	document.getElementById('btnStart').addEventListener('click', (evt) => {
		evt.preventDefault();
		switch (evt.currentTarget.innerText) {
			case 'Start':
				console.log('Sam, start!');
				raceTrack.simulation.stop();
				raceTrack.init();
				raceTrack.simulation.alpha(1);
				setTimeout((e) => {
					raceTrack.simulation.restart();
					e.innerText = 'Pause';
					e.disabled = false;
					e.focus();
				}, 500, evt.currentTarget);
				evt.currentTarget.disabled = true;
				clearInterval(aniInterval);
				break;
			case 'Pause':
				raceTrack.simulation.stop();
				evt.currentTarget.innerText = 'Play';
				break;
			case 'Play':
				raceTrack.simulation.restart();
				evt.currentTarget.innerText = 'Pause';
				break;
		}
	});

	if (document.getElementById('btnTick') instanceof Element) {
		document.getElementById('btnTick').addEventListener('click', (evt) => {
			evt.preventDefault();
			raceTrack.simulation.tick();
			raceTrack.onTick();
		});
	}

	document.querySelector('input[type="file"]').addEventListener('change', (evt) => {
		const file = evt.target.files[0];
		if (file.type !== 'application/json') {
			evt.preventDefault();
			return;
		}

		const reader = new FileReader();
		reader.onload = ((jsonFile) => (e) => {
			const json = JSON.parse(e.target.result);
			raceTrack = RaceTrack.fromJson(json, svg);
			raceTrack.simulation.stop();
			buildReplay(raceTrack);

			// Reenable Export Button
			const btnExport = document.querySelector('form #btnExport');
			if (btnExport instanceof HTMLElement) {
				btnExport.removeAttribute('disabled');
			}
		})(file);
		reader.readAsText(file);
	});
});

// Define a custom EventTarget to help with picking cameras through the video
const RaceEvents = (() => {
	const et = new EventTarget();
	const φListeners = new Set();
	let oldφ;
	et.addφListener = (φ, callback) => {
		φListeners.add(φ);
		et.addEventListener('φChange', (evt) => {
			if (evt.detail.φ === φ) callback(evt);
		});
	};
	et.φChange = (newφ, callback) => {
		// Dispatch event for RaceCameras to listen to
		φListeners.forEach((φ) => {
			if (oldφ <= φ && φ < newφ) {
				et.dispatchEvent(new CustomEvent('φChange', {
					detail: {
						φ,
					},
				}));
			}
		});
		oldφ = newφ;
	};
	return et;
})();

// Define a custom Camera object with lots of customizations for us
const RaceCamera = (() => {
	function RaceCamera(cameraType = '', cameraArgs = [], {
		φRange = [-Math.PI / 2, 3 * Math.PI / 2],
	} = {}) {
		this.φRange = φRange;
		this.uuid = Math.floor(Math.random() * 1e3).toString().padStart(3, '0');
	}

	const prototype = {
		setφToActivateCamera: {
			value(φ) {
				RaceEvents.addφListener(φ, (e) => {
					scene.activeCamera = this;
				});
			},
		},
	};

	return new Proxy(RaceCamera, {
		construct(target, args) {
			const [cameraType, cameraArgs] = args;
			const Camera = BABYLON[cameraType];
			if (!Camera) throw new TypeError(`Unknown camera type '${cameraType}'`);
			if (!(Camera.prototype instanceof BABYLON.TargetCamera))
				throw new TypeError(`Invalid camera type '${cameraType}'`);

			const camera = Object.create(Camera.prototype);
			Camera.apply(camera, cameraArgs);
			target.apply(camera, args);
			Object.defineProperties(camera.__proto__, prototype);
			return camera;
		},
	});
})();

window.addEventListener('raceEnd', (evt) => {
	if (Array.isArray(evt.detail) && evt.detail[0] instanceof RaceTrack) {
		buildReplay(...evt.detail);
	}
});

/* Documentation:
 * https://doc.babylonjs.com/babylon101/discover_basic_elements
 * https://doc.babylonjs.com/api/globals
 * https://doc.babylonjs.com/how_to/gui3d
 */
let aniInterval;

function buildReplay(raceTrack, {
	OverheadCirclingSpeed = 5, // Frames per degree
	filmCountdownOnly = false,
	doExport = false,
	targetFrameRate = 30,
	renderFrameRate = 30,
} = {}) {
	clearInterval(aniInterval);
	const {
		AbstractMesh,
		Animation,
		AnimationGroup,
		Color3,
		Color4,
		DirectionalLight,
		Engine,
		FollowCamera,
		Mesh,
		MeshBuilder,
		Scene,
		SkyMaterial,
		StandardMaterial,
		Texture,
		UniversalCamera,
		Vector3,
		GUI,
		GrassProceduralTexture,
		DynamicTerrain,
	} = BABYLON;

	// First set the scene
	const canvas = document.querySelector('canvas#replay');
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);
	scene.useRightHandedSystem = true;
	scene.ambientColor = new Color3(0.8, 0.8, 0.8);

	// Find important properties of the track field
	const plane = {
		cross: Math.max(
			Math.abs(raceTrack.extrema[x][1] - raceTrack.extrema[x][0]),
			Math.abs(raceTrack.extrema[y][1] - raceTrack.extrema[y][0])
		),
		height: raceTrack.extrema[y][1] - raceTrack.extrema[y][0],
		width: raceTrack.extrema[x][1] - raceTrack.extrema[x][0],
		midpoint: new Vector3(
			(raceTrack.extrema[x][0] + raceTrack.extrema[x][1]) / 2,
			0,
			(raceTrack.extrema[y][0] + raceTrack.extrema[y][1]) / 2
		),
	};

	// Extend objects to use Spherical Coordinates
	// Origin is in center/midpoint of track field
	(() => {
		Object.entries({
			sPosition: {
				get() {
					const p = [
						this.position.x - plane.midpoint.x,
						this.position.y - plane.midpoint.y,
						this.position.z - plane.midpoint.z,
					];
					const r = Math.hypot(...p);
					return {
						r,
						φ: p[x] === 0 ? 0 : Math.atan(p[z] / p[x]) + (p[x] < 0 ? Math.PI : 0),
						θ: p[y] === 0 ? 0 : Math.acos(Math.hypot(p[x] / r, p[z] / r) / p[y] / r),
					};
				},
				set(...coords) {
					const [r, φ, θ] = Array.isArray(coords[0]) ? coords[0] : coords;
					this.position = new Vector3(
						r * Math.sin(θ) * Math.cos(φ) + plane.midpoint.x,
						r * Math.sin(θ) * Math.sin(φ) + plane.midpoint.z,
						r * Math.cos(θ) + plane.midpoint.y
					);
				},
			},
		}).forEach(([key, val]) => {
			[
				BABYLON.TransformNode.prototype,
				BABYLON.Camera.prototype,
			].forEach((obj) => {
				if (!obj.hasOwnProperty(key)) {
					Object.defineProperty(obj, key, val);
				}
			});
		});
	})();

	// Build the sky
	const skyMaterial = new SkyMaterial('sky', scene);
	skyMaterial.backFaceCulling = false;
	skyMaterial.luminance = 0.2;
	skyMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
	skyMaterial.sunPosition = new Vector3(10, 3, 1);
	skyMaterial.turbidity = 2;
	skyMaterial.rayleigh = 3;
	skyMaterial.cameraOffset.y = 200;

	// const skybox = Mesh.CreateBox(
	const skybox = Mesh.CreateSphere(
		'skyBox',
		5,
		plane.cross * 2,
		scene
	);
	skybox.material = skyMaterial;
	skybox.position = plane.midpoint;

	// Add Light from Sun
	const sun = new DirectionalLight('light2', skyMaterial.sunPosition.negate(), scene);
	sun.diffuse = new Color3(1, 1, 1);
	sun.intensity = 0.5;

	// TODO: To help determine if camera can be used, give each camera one or more of:
	// 1. bounding box which cameraTarget must be in
	// 2. maximum distance between camera and cameraTarget
	// 3. range of acceptable cameraTarget.sPosition.φ values
	const cameras = [
		new RaceCamera('UniversalCamera', [
			'cameraTopLeftCorner',
			new Vector3(raceTrack.extrema[x][0], 20, raceTrack.extrema[y][0] - 30),
			scene,
		], {
			φRange: [150 * Math.PI / 180, 5 * Math.PI / 4],
		}),
		new RaceCamera('UniversalCamera', [
			'cameraOverheadCenter',
			new Vector3(-35, 160, 2 * raceTrack.extrema[y][1]),
			scene,
		]),
		new RaceCamera('UniversalCamera', [
			'cameraTopRightCorner',
			new Vector3(raceTrack.extrema[x][1] + 10, 20, raceTrack.extrema[y][0] - 10),
			scene,
		], {
			φRange: [-Math.PI / 2, 10 * Math.PI / 180],
		}),
		new RaceCamera('UniversalCamera', [
			'cameraBackMidfield',
			new Vector3(-50, 50, raceTrack.extrema[y][1] + 70),
			scene,
		], {
			φRange: [0 * Math.PI / 180, 125 * Math.PI / 180],
		}),
		new RaceCamera('UniversalCamera', [
			'cameraCircling',
			new Vector3(raceTrack.extrema[x][0] + 200, 20, raceTrack.extrema[y][0] - 10),
			scene,
		]),
	];
	cameras.find(cam => cam.id === 'cameraTopRightCorner').setφToActivateCamera(0);

	// Define Surface Materials
	const grass = new StandardMaterial('grass', scene);
	grass.ambientColor = new Color3(0x7f / 0xff, 0xe5 / 0xff, 0x70 / 0xff);
	grass.ambientTexture = new GrassProceduralTexture('grassPT', 256, scene);
	grass.specularColor = new Color3(0x50 / 0xff, 0x50 / 0xff, 0x50 / 0xff);

	const asphalt = new StandardMaterial('asphalt', scene);
	asphalt.ambientColor = new Color3(0xb7 / 0xff, 0xb5 / 0xff, 0xba / 0xff);
	asphalt.specularColor = new Color3(0x60 / 0xff, 0x60 / 0xff, 0x60 / 0xff);
	const rpt = new GrassProceduralTexture('asphaltPT', 256, scene);
	rpt.grassColors = [
		new Color3(0xb7 / 0xff, 0xb5 / 0xff, 0xba / 0xff),
		new Color3(0x87 / 0xff, 0x85 / 0xff, 0x8a / 0xff),
		new Color3(0x97 / 0xff, 0x95 / 0xff, 0x9a / 0xff),
	];
	asphalt.ambientTexture = rpt;

	const black = new StandardMaterial('black', scene);
	black.diffuseColor = new Color3(1 / 0xff, 1 / 0xff, 1 / 0xff);
	black.ambientColor = new Color3(1 / 0xff, 1 / 0xff, 1 / 0xff);

	const trackSiding = new StandardMaterial('trackSiding', scene);
	trackSiding.diffuseColor = new Color3(0xeb / 0xff, 0x58 / 0xff, 0x63 / 0xff);
	trackSiding.ambientColor = new Color3(0xeb / 0xff, 0x58 / 0xff, 0x63 / 0xff);
	trackSiding.specularColor = new Color3(0xa0 / 0xff, 0xa0 / 0xff, 0xa0 / 0xff);

	// Add ground
	const dtGround = (() => {
		const vertexSpacing = 5;
		const mapSubX = 200;
		const mapSubZ = 200;
		const terrainSub = 60;

		const mapData = new Float32Array(mapSubX * mapSubZ * 3);
		for (let l = 0; l < mapSubZ; l++) {
			for (let w = 0; w < mapSubX; w++) {
				const point = [
					(w - mapSubX / 2) * vertexSpacing,
					-0.05,
					(l - mapSubZ / 2) * vertexSpacing,
				];
				mapData[3 * (l * mapSubX + w) + x] = point[x];
				mapData[3 * (l * mapSubX + w) + y] = point[y];
				mapData[3 * (l * mapSubX + w) + z] = point[z];
			}
		}

		// Ground Terrain
		const dtGround = new DynamicTerrain('dtGround', {
			mapData,
			mapSubX,
			mapSubZ,
			terrainSub,
		}, scene);
		dtGround.updateCameraLOD = camera => Math.abs((camera.globalPosition.y / 10)|0);
		dtGround.mesh.material = grass;
		dtGround.isAlwaysVisible = true;
		return dtGround;
	})();

	// Stands
	((grandStand = {}) => {
		const {
			trackEdge = -20,
			sideHeight = 2,
			front = -50,
			back = -150,
			left = -100,
			right = 100,
			height = 50,
		} = grandStand;
		const stands = MeshBuilder.CreateRibbon('stands', {
			closePath: false,
			pathArray: [
				[
					new Vector3(right, -0.03, trackEdge),
					new Vector3(right, -0.03, front),
					new Vector3(right, height, back),
				],
				[
					new Vector3(left, -0.03, trackEdge),
					new Vector3(left, -0.03, front),
					new Vector3(left, height, back),
				],
			],
		}, scene);
		const crowd = new StandardMaterial('crowd', scene);
		crowd.ambientColor = new Color3(0xaa / 0xff, 0xaa / 0xff, 0xaa / 0xff);
		crowd.specularColor = new Color3(0x40 / 0xff, 0x40 / 0xff, 0x40 / 0xff);
		const cpt = new GrassProceduralTexture('crowdPT', 256, scene);
		cpt.grassColors = [
			new Color3(0xa5 / 0xff, 0xa5 / 0xff, 0xd7 / 0xff),
			new Color3(0xd7 / 0xff, 0xa5 / 0xff, 0xaa / 0xff),
			new Color3(0xa5 / 0xff, 0xd7 / 0xff, 0xa5 / 0xff),
		];
		crowd.ambientTexture = cpt;
		stands.material = crowd;

		const sides = MeshBuilder.CreateRibbon('standsSides', {
			sideOrientation: Mesh.DOUBLESIDE,
			closePath: false,
			pathArray: [
				[
					new Vector3(right, -0.03, trackEdge),
					new Vector3(right, -0.03, front),
					new Vector3(right, -0.03, back),
					new Vector3(right, -0.03, back),
					new Vector3(left, -0.03, back),
					new Vector3(left, -0.03, back),
					new Vector3(left, -0.03, front),
					new Vector3(left, -0.03, trackEdge),
				],
				[
					new Vector3(right, -0.03 + sideHeight, trackEdge),
					new Vector3(right, -0.03 + sideHeight, front),
					new Vector3(right, height + sideHeight, back),
					new Vector3(right, height + sideHeight, back),
					new Vector3(left, height + sideHeight, back),
					new Vector3(left, height + sideHeight, back),
					new Vector3(left, -0.03 + sideHeight, front),
					new Vector3(left, -0.03 + sideHeight, trackEdge),
				],
			],
		}, scene);
		const standsSiding = new StandardMaterial('standsSiding', scene);
		standsSiding.diffuseColor = new Color3(0x63 / 0xff, 0x63 / 0xff, 0x63 / 0xff);
		standsSiding.ambientColor = new Color3(0x83 / 0xff, 0x83 / 0xff, 0x83 / 0xff);
		standsSiding.specularColor = new Color3(0xd0 / 0xff, 0xd0 / 0xff, 0xd0 / 0xff);
		sides.material = standsSiding;
	})(raceTrack.grandStand);

	// Set animation of overhead circling camera
	(() => {
		const keys = [];
		const a = new Animation('spinningCamera', 'position', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);

		const [
			axisX,
			axisZ,
		] = (() => {
			if (plane.height < plane.width)
				return [
					plane.width * (1 / 2 + 1 / 5),
					plane.height * (1 / 2 + 1 / 2),
				];
			return [
					plane.width * (1 / 2 + 1 / 6),
					plane.height * (1 / 2 + 1 / 6),
			];
		})();

		// TODO: Add camera target that's circling the center in the opposite direction such that
		// when camera is closest to center, the camera target is at the opposite point in their orbits,
		// but when camera is furthest from center, the camera target is closest to camera
		// X: Math.sin(-i * Math.PI / 180) * 10 + plane.midpoint.x,
		// Z: Math.cos(-i * Math.PI / 180) * 10 + plane.midpoint.z

		for (let i=0; i<360; i++) {
			keys.push({
				frame: Math.floor(i * OverheadCirclingSpeed),
				value: new Vector3(
					Math.cos((180 + i) * Math.PI / 180) * axisX + plane.midpoint.x,
					100,
					Math.sin((180 + i) * Math.PI / 180) * axisZ + plane.midpoint.z
				),
			});
		}
		a.setKeys(keys);

		const animes = new AnimationGroup('animeFlyover');
		animes.normalize(0, keys[keys.length - 1].frame);

		// Point camera at front cars
		const cars = raceTrack.cars.slice(0, 3);
		const position = new Vector3(
			cars.reduce((sum, car) => sum + car.posn[0].x, 0) / cars.length,
			cars.reduce((sum, car) => sum + car.radius, 0) / cars.length,
			cars.reduce((sum, car) => sum + car.posn[0].y, 0) / cars.length
		);
		cameras.filter(cam => cam.id === 'cameraCircling').forEach((cam) => {
			cam.lockedTarget = position;
			animes.addTargetedAnimation(a, cam);
		});

		animes.play(true);
	})();

	// Build the track
	const precision = 500;
	const trackArray = [[], []];
	const railArray = [[], []];
	raceTrack.rails.forEach((rail, i) => {
		const pathLength = rail.getTotalLength();
		for (let j = 0; j < 100; j += 100 / precision) {
			const point = rail.getPointAtLength(pathLength * j / 100);
			trackArray[i].push(new Vector3(point.x, 0, point.y));
			railArray[i].push(new Vector3(point.x, 5, point.y));
		}
	});
	railArray.forEach((path, i) => {
		const pathArray = [
			path,
			trackArray[i],
		];
		const rail = MeshBuilder.CreateRibbon(`rail${i}`, {
			sideOrientation: Mesh.DOUBLESIDE,
			pathArray,
			closePath: true,
		}, scene);
		rail.material = trackSiding;
	});
	// Build track after siding because of the array reverse
	const track = MeshBuilder.CreateRibbon('track', {
		pathArray: trackArray.reverse(),
		closePath: true,
	}, scene);
	track.material = asphalt;

	// Add starting line
	const gradStartLine = raceTrack.gradients[0];
	const startLine = MeshBuilder.CreateLines('startLine', {
		points: [
			new Vector3(
				gradStartLine.x - gradStartLine.width * Math.sin(gradStartLine.α),
				0.02,
				gradStartLine.y + gradStartLine.width * Math.cos(gradStartLine.α)
			),
			new Vector3(
				gradStartLine.x + gradStartLine.width * Math.sin(gradStartLine.α),
				0.02,
				gradStartLine.y - gradStartLine.width * Math.cos(gradStartLine.α)
			),
		],
		colors: new Array(2).fill(new Color4(0, 0, 0, 1)),
		useVertexAlpha: false,
	}, scene);
	startLine.material = black;

	const cars = raceTrack.cars.slice();

	// Place cars in starting positions
	cars.forEach((car) => {
		const posn = car.posn[0];
		car.sphere = MeshBuilder.CreateSphere(`sphere${car.name}`, {
			segments: 16,
			diameter: car.radius * 2,
		}, scene);
		car.sphere.position = new Vector3(posn.x, car.radius, posn.y);

		if (Array.isArray(car.rgb)) {
			const material = new StandardMaterial(`${car.name}Material`, scene);
			material.diffuseColor = new Color3(...car.rgb.map(c => c / 0xff));
			material.ambientColor = new Color3(...car.rgb.map(c => c / 0xff));
			material.diffuseTexture = new Texture('ball.png', scene);
			car.sphere.material = material;
		}
	});

	let numFrames = 7;
	const df = 3; // Frames between ticks
	const startWaitTime = 5; // Delay at start of video before running, in seconds
	const animationLoopMode = doExport ? Animation.ANIMATIONLOOPMODE_CONSTANT : Animation.ANIMATIONLOOPMODE_CYCLE;
	let currentStage;

	// Directorial Control over Video!
	const stages = {
		flyover: {
			playTime: filmCountdownOnly ? 1 : 20,
			nextStage: 'countdown',
			loopAnimes: true,
			camera: cameras.find(cam => cam.id === 'cameraCircling'),
			cameras,
		},
		countdown: {
			animes: new AnimationGroup('animeCountdown'),
			camera: cameras.find(cam => cam.id === 'cameraOverheadCenter'),
			nextStage: 'race',
			playTime: 3.5,
		},
		race: {
			animes: new AnimationGroup('animeRace'),
			secondsToSwitchCameras: 5,
			rotateCamera: true,
			cameras,
			nextStage: 'afterRace',
		},
		afterRace: {
			secondsToSwitchCameras: 2.5,
			rotateCamera: true,
			playTime: 20,
			cameras,
		},
	};

	// Programmatic Control over Video!
	stages.events = new EventTarget();

	// Set up stage with camera and start animations!
	stages.events.addEventListener('start', function (e) {
		currentStage = e.detail;
		const stage = stages[currentStage];
		if (!stage) throw Error(`Could not find stage ${currentStage}`);
		if (typeof stage.camera === 'string') scene.activeCamera = cameras.find(cam => cam.id === stage.camera);
		else if (stage.camera instanceof BABYLON.TargetCamera) scene.activeCamera = stage.camera;
		if (typeof stage.onStartStage === 'function') stage.onStartStage();
		if (stage.animes instanceof AnimationGroup) stage.animes.play(!!stage.loopAnimes);
		if (Number.isFinite(stage.playTime) && stage.playTime > 0) {
			setTimeout(() => {
				this.dispatchEvent(new CustomEvent('end', { detail: currentStage }));
			}, stage.playTime * 1000 * targetFrameRate / renderFrameRate);
		}
	});

	// Clean up stage to prepare for next stage of video
	stages.events.addEventListener('end', function (e) {
		const stageName = e.detail;
		if (stages[stageName]) {
			const stage = stages[stageName];
			if (typeof stage.onEndStage === 'function') stage.onEndStage();
			if (stage.nextStage && stages[stage.nextStage]) {
				this.dispatchEvent(new CustomEvent('start', { detail: stage.nextStage }));
			}
			if (stage.overlay && stage.overlay.autoDispose) {
				stage.overlay.dispose();
			}
		}
	});

	// Add track flyover at start of video
	((stage) => {
		if (doExport) return; // Not yet ready for presentation
		return; // Not yet ready for presentation

		// Get position frames
		const flyoverPoints = raceTrack.gradients.filter(piece => piece.flyoverPoint);

		// No flyover points? Don't bother
		if (flyoverPoints.length === 0) {
			return;
		}

		const keys = [];
		const flyoverLoopMode = cars[0].posn.length <= 1 ? Animation.ANIMATIONLOOPMODE_CYCLE : Animation.ANIMATIONLOOPMODE_CONSTANT;
		const animations = [
			new Animation('flyoverTrackP', 'position', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, flyoverLoopMode),
			new Animation('flyoverTrackR', 'rotationOffset', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, flyoverLoopMode),
		];
		animations.forEach(a => keys.push([]));

		stage.rotateCamera = false;

		flyoverPoints.push(flyoverPoints.slice(0, 1));
		let frame = 0;
		flyoverPoints.forEach((piece, i, a) => {
			const positionValue = new Vector3(piece.x, 0, piece.y);

			if (i > 0) {
				const last = a[i - 1];
				frame += Vector3.Distance(positionValue, new Vector3(last.x, 0, last.y)) / 75 * targetFrameRate;
			}

			keys[0].push({
				frame,
				value: positionValue,
			});

			// TODO: Point towards next flyoverPoint
			keys[1].push({
				frame,
				value: -90,
			});
		});

		// Set animation frame keys
		animations.map((a, i) => {
			a.setKeys(keys[i]);
		});

		const startPosition = new Vector3(-140, 70, 0);
		const cameraTarget = new AbstractMesh('flyoverTarget', scene);

		const followCamera = new FollowCamera('flyoverCamera', startPosition, scene, cameraTarget);
		followCamera.radius = startPosition.length();
		followCamera.heightOffset = 100;
		followCamera.rotationOffset = -180;
		followCamera.noRotationConstraint = true;
		followCamera.maxCameraSpeed = 5;
		followCamera.acceleration = 0;

		// Set flyover camera and start flyover
		stage.camera = followCamera;
		stage.animes = new AnimationGroup('animeFlyover');
		stage.animes.addTargetedAnimation(animations[0], cameraTarget);
		stage.animes.normalize(0, frame);
		// Don't timeout on flyover
		stage.loopAnimes = false;
		stage.playTime = false;
	})(stages.flyover);

	// Display countdown
	((stage) => {
		const {
			AdvancedDynamicTexture,
			Control,
			Rectangle,
			TextBlock,
		} = GUI;

		const advancedTexture = new AdvancedDynamicTexture.CreateFullscreenUI('myUI');
		advancedTexture.useInvalidateRectOptimization = false;
		advancedTexture.renderScale = 2;
		stage.overlay = advancedTexture;

		// Panel to show countdown
		const panelCountdown = new Rectangle();
		panelCountdown.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		panelCountdown.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		panelCountdown.background = 'white';
		panelCountdown.height = '0.1';
		panelCountdown.width = '0.25';
		panelCountdown.paddingLeft = '20%';
		panelCountdown.clipChildren = false;
		panelCountdown.clipContent = false;
		panelCountdown.cornerRadius = 100;

		const txt = new TextBlock();
		txt.fontSize = 100;
		txt.fontWeight = 'bold';
		txt.color = 'black';
		txt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		txt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		txt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		txt.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		panelCountdown.addControl(txt);

		let i = 3;
		let countdown;
		const fnUpdateCountDown = () => {
			if (i === 3) advancedTexture.addControl(panelCountdown);
			if (i > 0) txt.text = i.toString();
			else txt.text = 'Go!';
			i--;
		};
		stage.onStartStage = () => {
			setTimeout(() => {
				fnUpdateCountDown(); // 3
				countdown = setInterval(fnUpdateCountDown, 1000 * targetFrameRate / renderFrameRate); // 2, 1
			}, 500 * targetFrameRate / renderFrameRate);
		};

		// TODO: Switch to animation events
		stage.onEndStage = () => {
			if (countdown) {
				fnUpdateCountDown(); // Go!
				clearInterval(countdown);
			}
			setTimeout(() => {
				advancedTexture.removeControl(panelCountdown);
				advancedTexture.dispose();
			}, 1000 * targetFrameRate / renderFrameRate);
		};
	})(stages.countdown);

	const orderByTickDesc = (a, b) => b.tick - a.tick;

	// Get cars' positions at tick in position order
	const getRaceState = ((topCars) => {
		let ourCars = [];

		// First, simplify objects and cache
		const reset = () => {
			ourCars = topCars.map((car) => ({
				name: car.name,
				radius: car.radius,
				lenTime: car.time.length,
				time: car.time.slice().sort(orderByTickDesc),
				posn: car.posn.slice().sort(orderByTickDesc),
			}));
		};
		reset();

		const fn = (tick) => {
			ourCars.forEach((car) => {
				car.curTime = car.time.find(time => time.tick <= tick);
				car.curPosn = car.posn.find(posn => posn.tick <= tick);
			});
			ourCars.sort((a, b) => {
				if (a.lenTime === 0 && b.lenTime === 0) return 0;
				if (a.lenTime === 0) return 1;
				if (b.lenTime === 0) return -1;

				if (typeof a.curTime === 'undefined' && typeof b.curTime === 'undefined') return 0;
				if (typeof a.curTime === 'undefined') return 1;
				if (typeof b.curTime === 'undefined') return -1;

				if (a.curTime.lap < b.curTime.lap) return 1;
				if (a.curTime.lap > b.curTime.lap) return -1;
				if (a.curTime.piece !== b.curTime.piece) {
					// Piece 0 is last piece of the lap
					if (a.curTime.piece === 0) return -1;
					if (b.curTime.piece === 0) return 1;
					if (a.curTime.piece < b.curTime.piece) return 1;
					if (a.curTime.piece > b.curTime.piece) return -1;
				}
				if (a.curTime.tick < b.curTime.tick) return -1;
				if (a.curTime.tick > b.curTime.tick) return 1;

				return 0;
			});

			return ourCars;
		};
		fn.reset = reset;

		return fn;
	})(cars);

	let raceCameraTarget;

	// Build Replay Animation
	if (cars[0].posn.length > 1) {
		let lastTick = 0;

		const TwoPi = Math.PI * 2;
		cars.forEach((car) => {
			let zr = 0;
			let yr = 0;

			const keys = [];
			const animations = [
				new Animation(`moveAnime${car.name}`, 'position', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, animationLoopMode),
				new Animation(`spinAnime${car.name}`, 'rotation', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, animationLoopMode),
			];
			animations.forEach(a => keys.push([]));

			car.posn.forEach((frame) => {
				const numFrame = frame.tick * df;
				// Animate car positions
				keys[0].push({
					frame: numFrame,
					value: new Vector3(frame.x, car.radius, frame.y),
				});
				// Animate car rotation
				const v = Math.hypot(frame.vx, frame.vy);
				if (v > 0) {
					// Angle car is now pointed
					const α = -Math.sign(frame.vy) * Math.acos(frame.vx / v);
					// Get angle difference within one full rotation in either direction
					let d = α % TwoPi - yr % TwoPi;
					// Reverse direction to avoid spinning the wrong way on a turn/bounce
					while (Math.abs(d) > Math.PI) d = d - Math.sign(d) * TwoPi;
					// Update angles
					yr += d;
					zr -= v * Math.PI / 16;
				}
				keys[1].push({
					frame: numFrame,
					value: new Vector3(0, yr, zr),
				});

				lastTick = Math.max(lastTick, frame.tick);
			});

			// Find last frame for video
			numFrames = keys.reduce((n, f) => Math.max(n, f[f.length - 1].frame), numFrames);

			// Set animation frame keys and add to group
			animations.forEach((a, i) => {
				a.setKeys(keys[i]);
				stages.race.animes.addTargetedAnimation(a, car.sphere);
			});
		});

		// Add Export button to save video replay
		if (!(document.querySelector('form #btnExport') instanceof HTMLElement)) {
			const btn = document.createElement('button');
			btn.setAttribute('id', 'btnExport');
			btn.innerText = 'Export';

			btn.addEventListener('click', () => {
				btn.setAttribute('disabled', 'disabled');
				clearInterval(aniInterval);
				buildReplay(raceTrack, {
					OverheadCirclingSpeed: 4, // Frames per degree
					doExport: true,
					targetFrameRate: 60,
					renderFrameRate: 2,
				});
			});

			const form = document.querySelector('form');
			if (form instanceof Element) {
				form.appendChild(btn);
			}
		}

		// Animation for camera targets throughout video
		(() => {
			const keys = [];
			const animations = [
				new Animation('cameraTrack', 'position', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, animationLoopMode),
			];
			animations.forEach(a => keys.push([]));

			for (let tick=0; tick < lastTick; tick++) {
				// Get front two cars
				const frontCars = getRaceState(tick).slice(0, 3);
				const position = [
					frontCars.reduce((sum, car) => sum + car.curPosn.x, 0) / frontCars.length,
					frontCars.reduce((sum, car) => sum + car.radius, 0) / frontCars.length,
					frontCars.reduce((sum, car) => sum + car.curPosn.y, 0) / frontCars.length,
				];
				keys[0].push({
					frame: tick * df,
					// Point at midpoint
					value: new Vector3(...position),
					φ: position[x] === 0 ? 0 : Math.atan(position[z] / position[x]),
				});
			}
			getRaceState.reset();

			// Find last frame for video
			numFrames = keys.reduce((n, f) => Math.max(n, f[f.length - 1].frame), numFrames);

			// Build Mesh and Animation for cameras' target
			raceCameraTarget = new AbstractMesh('raceCameraTarget', scene);
			// Start cameras pointing at start of animation
			raceCameraTarget.position = keys[0][0].value;
			stages.race.cameras.forEach(camera => camera.lockedTarget = raceCameraTarget);

			cameras.filter(cam => cam.id === 'cameraCircling').forEach((cam) => {
				cam.lockedTarget = raceCameraTarget;
			});

			// Set animation frame keys and add to group
			animations.forEach((a, i) => {
				a.setKeys(keys[i]);
				stages.race.animes.addTargetedAnimation(a, raceCameraTarget);
			});
		})();

		// Set length of animation
		stages.race.animes.normalize(0, numFrames);
	} else {
		// Point cameras at start line
		delete stages.flyover.nextStage;
		stages.flyover.cameras.forEach(camera => camera.setTarget(new Vector3(0, 4.5, 0)));
	}

	/*
	 * https://doc.babylonjs.com/api/modules/babylon.gui
	 */
	// Display position information in screen overlay
	const drawOverlay = (() => {
		const {
			AdvancedDynamicTexture,
			Control,
			StackPanel,
			TextBlock,
			XmlLoader,
		} = GUI;

		const advancedTexture = new AdvancedDynamicTexture.CreateFullscreenUI('myUI');
		advancedTexture.useInvalidateRectOptimization = false;
		advancedTexture.renderScale = 2;
		stages.race.overlay = advancedTexture;
		stages.race.overlay.autoDispose = true;

		// Add panel to list cars by position
		const panelPositions = new StackPanel();
		panelPositions.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		panelPositions.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		panelPositions.background = 'white';
		panelPositions.width = '0.14';
		panelPositions.top = '0';
		panelPositions.left = '0';
		panelPositions.clipChildren = false;
		panelPositions.clipContent = false;

		stages.events.addEventListener('start', function (e) {
			if (e.detail !== 'flyover') return;
			advancedTexture.addControl(panelPositions);
		});

		// Add panel for lap counter
		const panelLap = new StackPanel();
		panelLap.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		panelLap.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		panelLap.background = 'white';
		panelLap.width = '0.1';
		panelLap.clipChildren = false;
		panelLap.clipContent = false;

		const txtLapCount = new TextBlock();
		txtLapCount.fontSize = 70;
		txtLapCount.height = '110px';
		txtLapCount.color = 'black';
		txtLapCount.paddingLeft = '20px';
		txtLapCount.paddingBottom = '20px';
		txtLapCount.paddingTop = '20px';
		txtLapCount.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		txtLapCount.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		panelLap.addControl(txtLapCount);

		const txtCarsPositions = new Array(cars.length).fill(0).map((b, i) => {
			// Draw names on screen overlay
			const txt = new TextBlock();
			txt.fontSize = 70;
			txt.color = 'black';
			txt.paddingLeft = '10px';
			txt.height = '90px';
			if (i === 0) {
				txt.paddingTop = '20px';
				txt.height = '110px';
			}
			txt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
			txt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
			panelPositions.addControl(txt);
			return txt;
		});

		return function(tick) {
			// Sort cars in order of race position
			getRaceState(tick).forEach((car, i) => {
				if (i === 0 && car.curTime) {
					// Update Lap Counter
					advancedTexture.addControl(panelLap);
					if (car.curTime.lap > raceTrack.laps) {
						txtLapCount.text = 'Finish!';
					} else if (car.curTime.lap > 0) {
						txtLapCount.text = `Lap ${car.curTime.lap} / ${raceTrack.laps}`;
					} else {
						txtLapCount.text = 'GO!';
					}
				}

				// Draw names on screen overlay
				txtCarsPositions[i].text = `${i + 1} ${car.name}`;
			});
		};
	})();

	// Define overlay for afterRace
	((stageName) => {
		const {
			AdvancedDynamicTexture,
			Control,
			StackPanel,
			TextBlock,
		} = GUI;
		const stage = stages[stageName];

		const advancedTexture = new AdvancedDynamicTexture.CreateFullscreenUI('myUI');
		advancedTexture.useInvalidateRectOptimization = false;
		advancedTexture.renderScale = 2;
		stage.overlay = advancedTexture;

		// Add panel to list cars by position
		const panelPositions = new StackPanel();
		panelPositions.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		panelPositions.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		panelPositions.background = 'white';
		panelPositions.width = '0.31';
		panelPositions.clipChildren = false;
		panelPositions.clipContent = false;

		const txtCarsPositions = new Array(cars.length).fill(0).map((b, i) => {
			// Draw names on screen overlay
			const txt = new TextBlock();
			txt.fontSize = 150;
			txt.color = 'black';
			txt.paddingLeft = '10px';
			txt.height = `${txt.fontSize + 30}px`;
			txt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
			txt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
			panelPositions.addControl(txt);
			return txt;
		});

		stages.events.addEventListener('start', function (e) {
			if (e.detail !== stageName) return;
			advancedTexture.addControl(panelPositions);
		});

		stage.overlay.render = () => {
			// Sort cars in order of race position
			const maxTick = cars.reduce((tick, c) => Math.max(tick, c.lapTimes[c.lapTimes.length - 1].tick), 0);
			getRaceState(maxTick).forEach((car, i) => {
				// Draw names on screen overlay
				txtCarsPositions[i].text = `${i + 1} ${car.name}`;
			});
		};
	})('afterRace');

	scene.activeCamera = cameras[0];

	const CameraPicker = (() => {
		let n = 1;

		function setActiveCamera(newActiveCameraIndex) {
			if (!Number.isInteger(newActiveCameraIndex) || newActiveCameraIndex < 0) {
				throw new TypeError('newActiveCameraIndex must be a nonnegative integer');
			}
			n = newActiveCameraIndex;
			scene.activeCamera = cameras[newActiveCameraIndex % cameras.length];
		}

		stages.race.animes.onAnimationGroupPlayObservable.add(() => {
			n = 0;
		});
		stages.race.animes.onAnimationGroupEndObservable.add(() => {
			n = 0;
		});

		function pickNextCamera() {
			// Change cameras during race
			if (stages[currentStage].rotateCamera === true && frame % stages[currentStage].framesToSwitchCameras === 0) {
				if (raceCameraTarget instanceof AbstractMesh) {
					// console.log('Sam,', raceCameraTarget.id, (raceCameraTarget.sPosition.φ * 180 / Math.PI).toFixed(2));
					const keyCurrentCamera = n;
					const camera = scene.activeCamera;
					do {
						n++;
						if (cameras[n % cameras.length].φRange[0] <= raceCameraTarget.sPosition.φ
							&& raceCameraTarget.sPosition.φ < cameras[n % cameras.length].φRange[1]) {
							// console.log('Sam, using camera', n % cameras.length);
							break;
						}
						// console.log('Sam, do not use camera', n % cameras.length);
					} while (n % cameras.length !== keyCurrentCamera % cameras.length);
				} else {
					n++;
				}
				// cameras[++n % cameras.length].lockedTarget = cars[k % cars.length].sphere;
				setActiveCamera(n);

				if (n % cameras.length == 0) {
					k++;
				}
			}
		}

		return {
			pickNextCamera,
		};
	})();

	const videoWriter = ((doExport) => {
		if (doExport) {
			return new WebMWriter({
				quality: 0.95,
				frameRate: targetFrameRate,
			});
		}

		return {
			addFrame() {},
			complete() {
				return Promise.reject();
			},
		};
	})(doExport);

	let frame = 0;
	let k = 0;

	Object.entries(stages).forEach(([key, stage]) => {
		if (Number.isFinite(stage.secondsToSwitchCameras)) {
			stages[key].framesToSwitchCameras = stage.secondsToSwitchCameras * targetFrameRate;
		}
	});

	scene.beforeRender = (scene) => {
		if (dtGround.camera !== scene.activeCamera) {
			dtGround.camera = scene.activeCamera;
			if (dtGround.camera.position.y < 30) {
				dtGround.initialLOD = 5;
			}
		}
	};
	scene.afterRender = (scene) => {
		// Add frame to movie for export
		// But skip inital rending frames before everything is added
		if (doExport && (currentStage !== 'flyover' || frame > 5)) {
			videoWriter.addFrame(canvas);
		}
	};

	console.log('Sam, max number of frames:', numFrames);

	// Have Babylon Observables trigger JavaScript events
	Object.entries(stages).forEach(([detail, stage]) => {
		if (!(stage.animes instanceof AnimationGroup)) return;
		if (typeof stage.onStartAnimation === 'function') {
			stage.animes.onAnimationGroupPlayObservable.add(stage.onStartAnimation);
		}
		stage.animes.onAnimationGroupEndObservable.add(() => {
			stages.events.dispatchEvent(new CustomEvent('end', { detail }));
		});
	});

	stages.race.animes.onAnimationGroupPlayObservable.add(() => {
		currentStage = 'race';
		frame = 0;
		k = 0;
	});

	stages.race.animes.onAnimationGroupEndObservable.add(() => {
		currentStage = 'afterRace';
		frame = 0;
		k = 0;
		numFrames = stages.afterRace.playTime * targetFrameRate;
		stages.events.dispatchEvent(new CustomEvent('end', { detail: 'race' }));
	});

	// Render at our frame rate
	// TODO: Better implement generic stage object from stages
	aniInterval = setInterval(() => {
		scene.render();

		if ([
			'flyover',
			'countdown',
		].includes(currentStage)) drawOverlay(0);
		if (stages.race.animes.isPlaying) drawOverlay(frame / df);
		if (stages[currentStage].overlay && typeof stages[currentStage].overlay.render === 'function') {
			stages[currentStage].overlay.render(frame / df);
		}

		CameraPicker.pickNextCamera();
		if (raceCameraTarget instanceof AbstractMesh) {
			RaceEvents.φChange(raceCameraTarget.sPosition.φ);
		}

		frame++;

		if (frame % 20 === 0 && doExport) console.log('Sam, frame', frame, ',', (frame / targetFrameRate).toFixed(3), 'seconds');

		let endVideo = false;

		if (filmCountdownOnly && currentStage === 'race' && frame >= 1 * targetFrameRate) endVideo = true;

		if (currentStage === 'afterRace' && frame >= stages.afterRace.playTime * targetFrameRate) endVideo = true;

		// Animation finished, do not continue, save video
		if (endVideo) {
			console.log('Sam, at end of video!');

			if (doExport || filmCountdownOnly) {
				clearInterval(aniInterval);
				console.log('Sam, done running WebGL animation');
				// Display resulting video!
				videoWriter.complete().then((blob) => {
					const videoUrl = URL.createObjectURL(blob);
					const main = document.querySelector('main');
					if (main instanceof Element) {
						// Link to video
						const link = document.createElement('a');
						link.innerText = 'Open  in new window';
						link.setAttribute('target', '_blank');
						link.setAttribute('href', videoUrl);
						main.appendChild(link);

						// Video player
						const elVideo = document.createElement('video');
						const elSrc = document.createElement('source');
						elSrc.setAttribute('type', 'video/webm');
						elSrc.setAttribute('src', videoUrl);
						elVideo.appendChild(elSrc);
						main.appendChild(elVideo);
					} else {
						window.open(videoUrl, '_blank');
					}
				}).catch((e) => {
					console.error('Sam, videoWriter failed:', e);
				});
			} else {
				getRaceState.reset();
				stages.race.animes.play(false);
			}
		}
	}, 1000 / renderFrameRate);

	engine.resize();
	window.addEventListener('resize', () => {
		engine.resize();
	});

	// Finally, start animations!
	if (!currentStage) {
		stages.events.dispatchEvent(new CustomEvent('start', { detail: 'flyover' }));
	}
}
