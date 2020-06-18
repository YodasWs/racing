/* app.json */
const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;
const z = 2;
const radius = 4.5;
const strokeWidth = 1;

const TrackPiece = require('../src/js/TrackPiece');

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

	const OvalCourse = [
		{
			gradient: [1, 0],
			delta: [0, 0],
			width: 20,
			color: 'black',
		},
		{
			gradient: [1, 0],
			delta: [20, 0],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [1, 1],
			delta: [27, 13],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [0, 1],
			delta: [13, 27],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [-1, 1],
			delta: [-13, 27],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [-1, 0],
			delta: [-27, 13],
			width: 20,
			rail: [1, 1/4],
			color: 'lightgreen',
		},
		{
			gradient: [-1, 0],
			delta: [-120, 0],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [-1, -1],
			delta: [-27, -13],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [0, -1],
			delta: [-13, -27],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [1, -1],
			delta: [13, -27],
			width: 20,
			rail: [1, 1/4],
		},
		{
			gradient: [1, 0],
			delta: [27, -13],
			width: 20,
			rail: [1, 1/4],
		},
	];
	/**/

	json.cSuzuka.forEach((piece) => {
		piece.delta = piece.delta.map(a => a * 2);
		if (Array.isArray(piece.rail)) {
			piece.rail = piece.rail.map(a => a * 1.5);
		}
	});

	let raceTrack = new RaceTrack(svg, json.cSuzuka.map(piece => new TrackPiece(piece)), [
		new Car('Alice, TX', {
			color: 'lightgreen',
			color2: 'orange',
			rgb: [0x90, 0xee, 0x90],
		}),
		new Car('Dallas, TX', {
			color: 'white',
			color2: 'blue',
			r: 3,
			strokeWidth: 3,
			rgb: [0, 0, 0xff],
		}),
		new Car('Charlotte, NC', {
			color: '#249E57',
			color2: 'lightgrey',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0x24, 0x9E, 0x57],
		}),
		new Car('Brooklyn, NY', {
			color: 'white',
			color2: 'black',
			r: 3,
			strokeWidth: 3,
			rgb: [0x44, 0x44, 0x44],
		}),
		new Car('Edison, NJ', {
			color: 'lightblue',
			color2: 'cornflowerblue',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xAD, 0xD8, 0xE6],
		}),
		new Car('Florence, TN', {
			color: '#1E3258',
			color2: '#BF1F2D',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xBF, 0x1F, 0x2D],
		}),
	], {
		laps: 10,
	});

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

function RaceTrack(svg, track, cars, options = {}) {
	const simulation = d3.forceSimulation();

	Object.assign(this, {
		laps: 10,
	}, options, {
		gradients: [],
		rails: [],
		tick: 0,
		time: 0,
		finalStanding: [],
	});

	const gTrack = document.createElementNS(SVG, 'g');
	gTrack.setAttribute('id', 'gTrack');

	const gCars = document.createElementNS(SVG, 'g');
	gCars.setAttribute('id', 'gCars');

	if (svg instanceof SVGElement) {
		svg.appendChild(gTrack);
		svg.appendChild(gCars);
	}

	Object.defineProperties(this, {
		simulation: {
			get: () => simulation,
		},
		svg: {
			get: () => svg,
		},
		gTrack: {
			get: () => gTrack,
		},
		gCars: {
			get: () => gCars,
		},
	});

	if (Array.isArray(track)) {
		this.setTrack(track);
	}
	if (Array.isArray(cars)) {
		this.setCars(cars);
	}
}

RaceTrack.fromJson = (json, svg = null) => {
	if (!(svg instanceof SVGElement)) {
		svg = document.querySelector('svg');
	}

	// function RaceTrack(svg, track, cars, options)
	return new RaceTrack(
		svg,
		json.gradients.map(piece => new TrackPiece(piece)),
		json.cars,
		{
			laps: json.laps,
		}
	);
};

Object.defineProperties(RaceTrack.prototype, {
	init: {
		enumerable: true,
		value() {
			if (!(this.svg instanceof SVGElement)) {
				throw new Error('RaceTrack.init requires valid svg element!');
			}

			if (!this.svg.getElementById('gTrack')) {
				this.svg.appendChild(this.gTrack);
			}
			if (!this.svg.getElementById('gCars')) {
				this.svg.appendChild(this.gCars);
			}
			this.simulation.force('fCollide', d3.forceCollide(car => car.radius));
			this.simulation.force('fRailing', forceRailingBounce(this.rails));

			// Place Cars on Starting Line
			this.simulation.nodes().forEach((car, i) => {
				car.lapTimes = [];
				car.x = -7 * (i + 1);
				car.y = 5 * Math.pow(-1, i);
				// Start with some velocity to increase excitement at the start
				car.vx = 0.9;
				car.vy = 0;
				car.trackAhead = this.gradients.slice();
				car.posn = [];
			});
			this.moveCars();
			this.listCars();
			this.simulation.alphaDecay(0);
			this.simulation.velocityDecay(0.01);

			this.simulation.on('tick', () => {
				this.onTick();
			});

			return this;
		},
	},
	onTick: {
		value() {
			this.simulation.nodes(this.simulation.nodes());
			requestAnimationFrame((time) => {
				this.time = time;
			});
			this.tick++;
			this.moveCars();
			this.listCars();
			if (this.cars.every(c => c.lapTimes.length > this.laps)) {
				this.simulation.stop();

				// Remove circular reference for conversion to JSON
				this.cars.forEach((car) => {
					delete car.sphere;
				});
				const link = document.createElement('a');
				link.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(this))}`);
				const now = new Date();
				link.setAttribute('download', `race-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.json`);
				link.innerText = 'Save race data';
				document.querySelector('form').appendChild(link);

				buildReplay(this);
				return;
			}
			return this;
		},
	},
	moveCars: {
		value() {
			// Move Cars!
			d3.selectAll('#gCars circle').attr('cx', d => d.x).attr('cy', d => d.y);
			this.simulation.nodes().forEach((car, i, nodes) => {
				if (car.nextPiece) {
					// Add to time-tracking only on first crossover in the lap
					const piece = this.gradients.indexOf(car.trackAhead[0]);
					if (!car.time.some(t => t.lap === car.lapTimes.length && t.piece === piece)) {
						car.time.push({
							lap: car.lapTimes.length,
							piece,
							tick: this.tick,
							time: this.time,
						});

						// Cross the start/end line, next lap
						if (piece === 0) {
							if (!this.finalStanding.includes(car.name)) {
								car.lapTimes.push({
									tick: this.tick,
									time: this.time,
								});
							}

							if (car.lapTimes.length > this.laps) {
								// Finished!
								if (!this.finalStanding.includes(car.name)) {
									this.finalStanding.push(car.name);
								}
							}
						}
					}

					car.trackAhead.push(car.trackAhead.shift());
					car.nextPiece = false;
				}

				if (car.previousPiece) {
					car.trackAhead.unshift(car.trackAhead.pop());
					car.previousPiece = false;
				}

				// We finished race, so let's stop
				if (this.finalStanding.includes(car.name)) {
					const place = this.finalStanding.indexOf(car.name);

					car.y = Math.min(Math.max(-20, car.y), 20);

					if (car.x > this.gradients[0].x + (this.cars.length - place) * 10) {
						car.fx = car.x;
						car.fy = car.y;
					}
				}

				// Off track? Stop!
				if (car.x < this.extrema[x][0] - 10
					|| car.x > this.extrema[x][1] + 10
					|| car.y < this.extrema[y][0] - 10
					|| car.y > this.extrema[y][1] + 10) {
					this.simulation.stop();
				}
			});

			// Record positional data for future replay
			this.cars.forEach((car) => {
				car.posn.push({
					tick: this.tick,
					time: this.time,
					vx: car.vx,
					vy: car.vy,
					x: car.x,
					y: car.y,
				});
			});

			return this;
		},
	},
	setTrack: {
		enumerable: true,
		value(track) {
			this.gradients = track.filter(piece => piece instanceof TrackPiece);

			// Add Track Pieces to SVG
			let buildPosition = [0, 0];
			const extrema = [[0, 0], [0, 0]];
			const railPoints = [[], []];
			this.rails = new Array(2).fill({});

			const centerPoints = [];

			this.gTrack.innerHTML = '';
			this.gradients.forEach((grad, i) => {
				// Move build position
				buildPosition[x] += grad.delta[x];
				buildPosition[y] += grad.delta[y];

				centerPoints.push([buildPosition[x], buildPosition[y]]);

				grad.x = buildPosition[x];
				grad.y = buildPosition[y];

				// Add track forces to simulation
				if (grad.force) {
					this.simulation.force(`piece${i}`, grad.force);
				}

				// Rotate to gradient
				let α = Math.acos(grad.gradient[x] / Math.hypot(...grad.gradient));
				if (grad.gradient[y] < 0) {
					α = 2 * Math.PI - α;
				}
				const points = {
					x1: buildPosition[x] + grad.width * Math.sin(α),
					y1: buildPosition[y] - grad.width * Math.cos(α),
					x2: buildPosition[x] - grad.width * Math.sin(α),
					y2: buildPosition[y] + grad.width * Math.cos(α),
				};

				grad.m = (points.y2 - points.y1) / (points.x2 - points.x1);
				// y - y1 = m (x - x1); y = mx - mx1 + y1
				grad.b = -grad.m * points.x1 + points.y1;

				// Draw line
				const elLine = document.createElementNS(SVG, 'line');
				railPoints[0].push({
					before: [
						points.x1 - grad.width * Math.cos(α) * grad.rail[0],
						points.y1 - grad.width * Math.sin(α) * grad.rail[0],
					],
					is: [
						points.x1,
						points.y1,
					],
					after: [
						points.x1 + grad.width * Math.cos(α) * grad.rail[0],
						points.y1 + grad.width * Math.sin(α) * grad.rail[0],
					],
				});
				railPoints[1].push({
					before: [
						points.x2 - grad.width * Math.cos(α) * grad.rail[1],
						points.y2 - grad.width * Math.sin(α) * grad.rail[1],
					],
					is: [
						points.x2,
						points.y2,
					],
					after: [
						points.x2 + grad.width * Math.cos(α) * grad.rail[1],
						points.y2 + grad.width * Math.sin(α) * grad.rail[1],
					],
				});

				extrema[x][0] = Math.min(extrema[x][0], points.x1, points.x2);
				extrema[x][1] = Math.max(extrema[x][1], points.x1, points.x2);
				extrema[y][0] = Math.min(extrema[y][0], points.y1, points.y2);
				extrema[y][1] = Math.max(extrema[y][1], points.y1, points.y2);

				Object.entries(points).forEach(([attr, num]) => {
					elLine.setAttribute(attr, num);
				});
				elLine.classList.add('checkpoint');
				if (i === 0) {
					elLine.classList.add('start-line');
				}
				this.gTrack.appendChild(elLine);
				d3.select('svg #gTrack').append('circle')
					.attr('cx', grad.x).attr('cy', grad.y)
					.attr('r', i === 0 ? 1.5 : 2).attr('fill', grad.color || 'whitesmoke')
					.attr('strokeWidth', i === 0 ? '0.5px' : '0')
					.attr('stroke', i === 0 ? 'white' : 'none');

				// TODO: Calculate borders of piece for geofencing
			});

			this.extrema = extrema;

			// Draw railings along track
			railPoints.forEach((rail, j) => {
				rail.push(rail[0]);
				const elLine = document.createElementNS(SVG, 'path');
				const d = [];
				rail.forEach((point, i) => {
					if (i === 0) {
						d.push(`M${point.is.join(',')}`);
					} else {
						d.push(`C${[
							rail[i - 1].after.join(' '),
							point.before.join(' '),
							point.is.join(' '),
						].join(',')}`);
					}
				});
				elLine.setAttribute('d', d.join(''));
				this.gTrack.appendChild(elLine);
				this.rails[j] = elLine;
			});

			// Adjust SVG View Box
			const buffer = 10;
			let width = extrema[x][1] - extrema[x][0] + buffer * 2;
			let height = extrema[y][1] - extrema[y][0] + buffer * 2;
			let x0 = extrema[x][0] - buffer;
			let y0 = extrema[y][0] - buffer;

			if (height > width * 4 / 5) {
				width = height * 5 / 4;
				x0 = (extrema[x][0] + extrema[x][1] - width) / 2;
			} else {
				height = width * 4 / 5;
				y0 = (extrema[y][0] + extrema[y][1] - height) / 2;
			}

			this.svg.setAttribute('viewBox', `${x0} ${y0} ${width} ${height}`);

			// Center line around track
			d3.select('svg').append('g').selectAll('path').data([
				centerPoints,
			]).enter().append('path').attr(
				'd',
				d3.line().curve(d3.curveBasisClosed)
			).classed('lane-line', true);

			return this;
		},
	},
	setCars: {
		enumerable: true,
		value(cars) {
			d3.select('svg #gCars').selectAll('circle')
				.data(cars).enter().append('circle').classed('car', true)
				.attr('fill', d => d.color).attr('stroke', d => d.color2)
				.attr('stroke-width', car => car.strokeWidth)
				.attr('r', car => car.r).attr('cx', d => d.x).attr('cy', d => d.y);
			this.simulation.nodes(cars);
			this.cars = cars.slice();
			return this;
		},
	},

	listCars: {
		enumerable: true,
		value() {
			let leadPosition = [];

			const ol = document.querySelector('ol#positions');
			this.cars.slice().sort((a, b) => {
				if (a.time.length === 0 && b.time.length === 0) return 0;
				if (a.time.length === 0) return 1;
				if (b.time.length === 0) return -1;
				if (a.time.length > b.time.length) return -1;
				if (a.time.length < b.time.length) return 1;
				if (a.time[a.time.length - 1].time > b.time[b.time.length - 1].time) return 1;
				if (a.time[a.time.length - 1].time < b.time[b.time.length - 1].time) return -1;
				return 0;
			}).forEach((car, i) => {
				if (!(car.elPositionList instanceof Element)) {
					car.elPositionList = document.createElement('li');

					const elName = document.createElement('span');
					elName.classList.add('name');
					elName.innerText = car.name;
					car.elPositionList.appendChild(elName);

					const elTime = document.createElement('span');
					elTime.classList.add('time');
					car.elPositionList.appendChild(elTime);
				}
				const li = car.elPositionList;

				if (car.time.length > 1) {
					const lastTime = car.time.slice().pop();

					if (i === 0) {
						leadPosition = car.time.slice();
					}

					const elTime = li.querySelector('.time');
					if (i === 0) {
						const time = ((lastTime.time - car.time[0].time) / 1000).toFixed(2);
						if (elTime.innerText !== time) elTime.innerText = time;
						elTime.classList.remove('fade-out');
					} else {
						const leadTime = leadPosition.filter(t => t.lap === lastTime.lap && t.piece === lastTime.piece)
							.sort((a, b) => a.time - b.time)[0];
						let time = (lastTime.time - leadTime.time) / 1000;
						if (time > 0) time = `+${time.toFixed(2)}`;
						else time = time.toFixed(2);
						if (elTime.innerText !== time) {
							elTime.classList.remove('fade-out');
							if (car.lapTimes.length < this.laps) setTimeout(() => {
								elTime.classList.add('fade-out');
							}, 1000);
							elTime.innerText = time;
						}
					}
				}
				li.style.order = i;
				li.setAttribute('order', i + 1);
				if (!ol.contains(li)) ol.appendChild(li);
			});
			return this;
		},
	},
});

function Car(name, options = {}) {
	Object.assign(this, {
		strokeWidth: 1,
		r: 4,
	}, options, {
		trackAhead: [],
		nextPiece: false,
		previousPiece: false,
		lapTimes: [],
		time: [],
		posn: [],
	});


	Object.defineProperties(this, {
		name: {
			enumerable: true,
			get: () => name,
		},
		radius: {
			enumerable: true,
			get: () => this.r + this.strokeWidth / 2,
		},
	});
}
Object.defineProperties(Car.prototype, {
});

function closestPoint(pathNode, point) {
	const nextPoint = [
		point.x + point.vx,
		point.y + point.vy,
	];
	const dist = p => Math.hypot(p.x - nextPoint[x], p.y - nextPoint[y]);
	const pathLength = pathNode.getTotalLength();
	let precision = 16;
	let best;
	let bestLength;
	let bestDistance = Number.POSITIVE_INFINITY;

	// Linear scan for coarse approximation
	for (let scanLength = 0; scanLength <= pathLength; scanLength += precision) {
		const scan = pathNode.getPointAtLength(scanLength);
		const scanDistance = dist(scan);
		if (scanDistance < bestDistance) {
			best = scan;
			bestLength = scanLength;
			bestDistance = scanDistance;
		}
	}

	// Too far away to bother calculating any closer
	if (bestDistance >= point.radius * 2 && bestDistance >= Math.hypot(point.vx, point.vy)) {
		return {
			distance: bestDistance,
		};
	}

	let after; // Need this to find the vector normal to the surface

	// Binary search for precise estimate
	precision /= 2;
	while (precision > 0.5) {
		const beforeLength = bestLength - precision;
		const before = pathNode.getPointAtLength(beforeLength);
		const beforeDistance = dist(before);

		const afterLength = bestLength + precision;
		after = pathNode.getPointAtLength(afterLength);
		const afterDistance = dist(after);

		if (beforeLength >= 0 && beforeDistance < bestDistance) {
			best = before;
			bestLength = beforeLength;
			bestDistance = beforeDistance;
		} else if (afterLength <= pathLength && afterDistance < bestDistance) {
			best = after;
			bestLength = afterLength;
			bestDistance = afterDistance;
		} else {
			precision /= 2;
		}
	}

	return {
		distance: bestDistance,
		after,
		best,
	};
}

// Define a custom Camera object with lots of customizations for us

const RaceCamera = (() => {
	function RaceCamera(cameraType, ...args) {
		this.φRange = [0, 2 * Math.PI];
	}

	Object.defineProperties(RaceCamera.prototype, {
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
					φ: p[x] === 0 ? 0 : Math.atan(p[z] / p[x]),
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
	});

	const fn = new Proxy(RaceCamera, {
		construct(target, args) {
			const cameraType = args[0];
			const Camera = BABYLON[cameraType];
			if (!Camera) throw new TypeError(`Unknown camera type '${cameraType}'`);
			if (!(Camera.prototype instanceof BABYLON.TargetCamera))
				throw new TypeError(`Invalid camera type '${cameraType}'`);

			const NewRaceCamera = Object.create(target);
			NewRaceCamera.prototype = Object.create(Camera.prototype);
			NewRaceCamera.prototype.constructor = RaceCamera;

			const obj = Object.create(NewRaceCamera.prototype);
			this.apply(target, obj, args);
			return obj;
		},
		apply(target, that, [cameraType, ...args]) {
			BABYLON[cameraType].apply(that, args);
			return target.apply(that, [cameraType, ...args]);
		},
	});
	return fn;
})();

/* Documentation:
 * https://doc.babylonjs.com/babylon101/discover_basic_elements
 * https://doc.babylonjs.com/api/globals
 * https://doc.babylonjs.com/how_to/gui3d
 */
let aniInterval;

function buildReplay(raceTrack, {
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
						φ: p[x] === 0 ? 0 : Math.atan(p[z] / p[x]),
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

	// TODO: Give each camera one or more of:
	// 1. bounding box for which cameraTarget must be for camera to be used
	// 2. maximum distance between camera and cameraTarget for camera to be used
	const cameras = [
		// new ArcRotateCamera('arc', -Math.PI / 2, 7 * Math.PI / 16, 100, new Vector3(0, 0, 0), scene),
		new RaceCamera('UniversalCamera', 'universalCamera3', new Vector3(raceTrack.extrema[x][0] - 10, 20, raceTrack.extrema[y][0] - 10), scene),
		new RaceCamera('UniversalCamera', 'universalCamera1', new Vector3(-35, 160, 2 * raceTrack.extrema[y][1]), scene),
		new RaceCamera('UniversalCamera', 'universalCamera2', new Vector3(raceTrack.extrema[x][1] + 10, 20, raceTrack.extrema[y][0] - 10), scene),
		new RaceCamera('UniversalCamera', 'universalCamera4', new Vector3(-35, 20, raceTrack.extrema[y][1] + 30), scene),
		new RaceCamera('UniversalCamera', 'universalCameraA', new Vector3(raceTrack.extrema[x][0] + 200, 20, raceTrack.extrema[y][0] - 10), scene),
	];

	/*
	cameras.forEach((cam) => {
		cam.attachControl(canvas, false);
	});
	/**/

	// Define Surface Materials
	const grass = new StandardMaterial('grass', scene);
	grass.ambientColor = new Color3(0x7f / 0xff, 0xe5 / 0xff, 0x70 / 0xff);
	grass.ambientTexture = new GrassProceduralTexture('grassPT', 256, scene);

	const asphalt = new StandardMaterial('asphalt', scene);
	asphalt.ambientColor = new Color3(0xb7 / 0xff, 0xb5 / 0xff, 0xba / 0xff);
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

	const siding = new StandardMaterial('siding', scene);
	siding.diffuseColor = new Color3(0xeb / 0xff, 0x58 / 0xff, 0x63 / 0xff);
	siding.ambientColor = new Color3(0xeb / 0xff, 0x58 / 0xff, 0x63 / 0xff);

	// Add ground
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

	const dtGround = new DynamicTerrain('dtGround', {
		mapData,
		mapSubX,
		mapSubZ,
		terrainSub,
	}, scene);
	dtGround.updateCameraLOD = camera => Math.abs((camera.globalPosition.y / 10)|0);
	dtGround.mesh.material = grass;
	dtGround.isAlwaysVisible = true;

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
				frame: i * 6,
				value: new Vector3(
					Math.cos(i * Math.PI / 180) * axisX + plane.midpoint.x,
					100,
					Math.sin(i * Math.PI / 180) * axisZ + plane.midpoint.z
				),
			});
		}
		a.setKeys(keys);

		const animes = new AnimationGroup('animeFlyover');
		animes.normalize(0, keys[keys.length - 1].frame);

		cameras.filter(cam => cam.id === 'universalCameraA').forEach((cam) => {
			cam.lockedTarget = plane.midpoint;
			animes.addTargetedAnimation(a, cam);
		});

		animes.play(true);
	})();

	// Build the track
	const precision = 100;
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
		rail.material = siding;
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
		car.sphere = MeshBuilder.CreateSphere('sphere', {
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
			camera: cameras.find(cam => cam.id === 'universalCameraA'),
			cameras,
		},
		countdown: {
			animes: new AnimationGroup('animeCountdown'),
			camera: cameras.find(cam => cam.id === 'universalCamera1'),
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
		return;

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

	// Build Replay Animation
	if (cars[0].posn.length > 1) {
		let lastTick = 0;

		const TwoPi = Math.PI * 2;
		cars.forEach((car, i) => {
			let zr = 0;
			let yr = 0;

			const keys = [];
			const animations = [
				new Animation(`moveAnime${car.name}`, 'position', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, animationLoopMode),
				new Animation(`spinAnime${car.name}`, 'rotation', renderFrameRate, Animation.ANIMATIONTYPE_VECTOR3, animationLoopMode),
			];
			animations.forEach(a => keys.push([]));

			car.posn.forEach((frame) => {
				// Animate car positions
				keys[0].push({
					frame: frame.tick * df,
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
					frame: frame.tick * df,
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
			const cameraTarget = new AbstractMesh('cameraTarget', scene);
			// Start cameras pointing at start of animation
			cameraTarget.position = keys[0][0].value;
			stages.race.cameras.forEach(camera => camera.lockedTarget = cameraTarget);

			// Set animation frame keys and add to group
			animations.forEach((a, i) => {
				a.setKeys(keys[i]);
				stages.race.animes.addTargetedAnimation(a, cameraTarget);
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
			getRaceState(numFrames / df).forEach((car, i) => {
				// Draw names on screen overlay
				txtCarsPositions[i].text = `${i + 1} ${car.name}`;
			});
		};
	})('afterRace');

	scene.activeCamera = cameras[0];

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
	let n = 1;

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
		n = 0;
	});

	stages.race.animes.onAnimationGroupEndObservable.add(() => {
		currentStage = 'afterRace';
		frame = 0;
		k = 0;
		n = 0;
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

		// Change cameras during race
		if (stages[currentStage].rotateCamera === true && frame % stages[currentStage].framesToSwitchCameras === 0) {
			n++;
			// cameras[++n % cameras.length].lockedTarget = cars[k % cars.length].sphere;
			scene.activeCamera = cameras[n % cameras.length];

			if (n % cameras.length == 0) {
				k++;
			}
		}

		frame++;

		if (frame % 10 === 0 && doExport) console.log('Sam, frame', frame, ',', (frame / targetFrameRate).toFixed(3), 'seconds');

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

function forceRailingBounce(rails) {
	let nodes = [];
	function force(alpha) {
		rails.forEach((rail) => {
			nodes.forEach((car) => {
				const cp = closestPoint(rail, car);
				// Bounce!
				// If car overlaping railing or car will run through railing
				// TODO: Need to construct force similar to d3.forceCollide to prevent bouncing off virtual/invisible railings
				if (cp.distance <= car.radius || cp.distance <= Math.hypot(car.vx / 2, car.vy / 2)) {
					// Vector normal to the surface at this point
					let normal = [
						cp.after.y - cp.best.y,
						cp.best.x - cp.after.x,
					];
					const N = Math.hypot(...normal);
					normal = normal.map(d => d / N);

					// Bounce only if car is moving into rail
					const position = [
						car.x - cp.best.x,
						car.y - cp.best.y,
					];

					// Point normal in same direction from the railing as the car
					if (Math.acos((position[x] * normal[x] + position[y] * normal[y]) / Math.hypot(...position)) >= Math.PI / 2) {
						// Normal is pointed in the wrong direction!
						normal[x] = -normal[x];
						normal[y] = -normal[y];
					}

					// We need to push this far off the railing
					// x' component of velocity vector
					const vxn = car.vx * normal[x] + car.vy * normal[y];

					if (Math.acos(vxn / Math.hypot(car.vx, car.vy)) < Math.PI / 2) {
						// We're already moving in the correct direction!
						return;
					}

					let bounceStrength = Math.random() + 1;
					let delta = [];
					let d = 0;

					do {
						bounceStrength += 0.05;
						delta = [
							bounceStrength * vxn * normal[x],
							bounceStrength * vxn * normal[y],
						];

						d = Math.hypot(
							car.x + car.vx - delta[x] - cp.after.x,
							car.y + car.vy - delta[y] - cp.after.y
						);

						// If running along the rail, try to push off
					} while (
						Math.abs((car.vx - delta[x]) * normal[x] + (car.vy - delta[y]) * normal[y]) <= Math.abs(vxn)
						&& d < car.radius
						&& bounceStrength < 3
					);

					// If bounceStrength < 2, there is a loss of velocity
					// Compensate for loss of x' with gain in y' to maintain (near-)same velocity
					if (bounceStrength < 2) {
						// Get tangent pointing in direction of forward movement
						const tangent = [
							-normal[y],
							normal[x],
						];
						if (Math.acos(
							(car.vx * tangent[x] + car.vy * tangent[y]) / Math.hypot(car.vx, car.vy)
						) > Math.PI / 2) {
							tangent[x] *= -1;
							tangent[y] *= -1;
						}

						// y' component of velocity vector
						const vyn = car.vx * tangent[x] + car.vy * tangent[y];
						bounceStrength = 0.1;

						// Don't want to lose too much speed from bounce
						while (Math.hypot(car.vx - delta[x], car.vy - delta[y]) < 0.6 * Math.hypot(car.vx, car.vy) && bounceStrength < 1) {
							bounceStrength += 0.1;
							delta[x] -= 0.1 * vyn * tangent[x];
							delta[y] -= 0.1 * vyn * tangent[y];
						}

						// But don't want to accelerate either
						while (Math.hypot(car.vx - delta[x], car.vy - delta[y]) > Math.hypot(car.vx, car.vy)) {
							delta[x] += 0.05 * vyn * tangent[x];
							delta[y] += 0.05 * vyn * tangent[y];
						}
					}

					// Finally, apply change in velocity
					car.vx -= delta[x];
					car.vy -= delta[y];
				}
			});
		});
	}

	force.initialize = (_) => {
		nodes = _;
	};

	return force;
}
