/* app.json */
const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;
const radius = 4.5;
const strokeWidth = 1;

yodasws.page('home').setRoute({
	template: 'pages/home.html',
	route: '/',
}).on('load', () => {
	const svg = document.querySelector('svg#scene');

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

	let raceTrack = new RaceTrack(svg, OvalCourse.map(piece => new TrackPiece(piece)), [
		new Car('Alice', {
			color: 'lightgreen',
			color2: 'orange',
			rgb: [0x90, 0xee, 0x90],
		}),
		new Car('Brooklyn', {
			color: 'white',
			color2: 'black',
			r: 3,
			strokeWidth: 3,
			rgb: [0x44, 0x44, 0x44],
		}),
		new Car('Charlotte', {
			color: '#249E57',
			color2: 'lightgrey',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0x24, 0x9E, 0x57],
		}),
		new Car('Dallas', {
			color: 'white',
			color2: 'blue',
			r: 3,
			strokeWidth: 3,
			rgb: [0, 0, 0xff],
		}),
		new Car('Edison', {
			color: 'lightblue',
			color2: 'cornflowerblue',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xAD, 0xD8, 0xE6],
		}),
		new Car('Florence', {
			color: '#1E3258',
			color2: '#BF1F2D',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xBF, 0x1F, 0x2D],
		}),
	], {
		laps: 3,
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

	document.getElementById('btnTick').addEventListener('click', (evt) => {
		evt.preventDefault();
		raceTrack.simulation.tick();
		raceTrack.onTick();
	});

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
		})(file);
		reader.readAsText(file);
	});
});

const gravity = 1 / 10;

function TrackPiece(options) {
	Object.assign(this, {
		gradient: [1, 0],
		delta: [0, 0],
		width: 20,
		rail: [1/2, 1/2],
	}, options);

	const hypot = Math.hypot(...this.gradient)
	let α = Math.acos(this.gradient[x] / hypot);
	if (this.gradient[y] < 0) {
		α = 2 * Math.PI - α;
	}
	this.α = α;

	this.force = (() => {
		let nodes = [];
		const piece = this;

		function force(alpha) {
			nodes.forEach((node) => {
				// Do not apply to Cars outside piece
				if (node.trackAhead.length === 0) return;
				if (node.trackAhead[0] !== piece) return;

				// Apply force in direction g-v to move v towards g
				let acceleration = [
					piece.gradient[x] - node.vx,
					piece.gradient[y] - node.vy,
				];

				// If acceleration is pointed in the wrong direction, don't use it
				if (Math.hypot(node.vx, node.vy) !== 0 && Math.acos((
					acceleration[x] * node.vx + acceleration[y] * node.vy
				) / Math.hypot(...acceleration) / Math.hypot(node.vx, node.vy)) > Math.PI / 2) {
					acceleration = [0, 0];
				}

				// Add gradient to acceleration to more strongly force movement in that direction
				acceleration = acceleration.map((d, i) => d + piece.gradient[i]);

				// Normalize acceleration and scale by gravity
				const a = Math.hypot(...acceleration);
				acceleration = acceleration.map(d => d / a);
				node.vx += gravity * acceleration[x] * alpha;
				node.vy += gravity * acceleration[y] * alpha;

				const nextPosition = [node.x + node.vx, node.y + node.vy];

				// Determine when the car moves off this piece and onto the next
				// If not vertical
				if (Number.isFinite(piece.m) && Number.isFinite(piece.b)
					&& piece.α !== 0 && piece.α !== Math.PI && piece.α !== 2 * Math.PI
				) {
					const y0 = piece.m * nextPosition[x] + piece.b;
					if (piece.α > 0 && piece.α < Math.PI && y0 <= nextPosition[y]) {
						node.nextPiece = true;
					}
					if (piece.α > Math.PI && y0 >= nextPosition[y]) {
						node.nextPiece = true;
					}
				} else {
					// Vertical, simply check x
					if (piece.α === 0 && piece.x < nextPosition[x]) {
						node.nextPiece = true;
					}
					if (piece.α === Math.PI && piece.x > nextPosition[x]) {
						node.nextPiece = true;
					}
				}

				// Determine if the car moved back a piece
				const lastPiece = node.trackAhead.slice(-1).pop();

				// If not vertical
				if (Number.isFinite(lastPiece.m) && Number.isFinite(lastPiece.b)
					&& lastPiece.α !== 0 && lastPiece.α !== Math.PI && lastPiece.α !== 2 * Math.PI
				) {
					const y0 = lastPiece.m * node.x + lastPiece.b;
					if (lastPiece.α > 0 && lastPiece.α < Math.PI && y0 > node.y) {
						node.previousPiece = true;
					}
					if (lastPiece.α > Math.PI && y0 < node.y) {
						node.previousPiece = true;
					}
				} else {
					// Vertical, simply check x
					if (lastPiece.α === 0 && lastPiece.x > node.x) {
						node.previousPiece = true;
					}
					if (lastPiece.α === Math.PI && lastPiece.x < node.x) {
						node.previousPiece = true;
					}
				}

				// Can't move forward AND backwards. Let's assume they've moved back and need a course correction
				if (node.previousPiece) {
					node.nextPiece = false;
				}
			});
		}

		force.initialize = (_) => {
			nodes = _;
		};

		return force;
	})();
}

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

	if (track instanceof Array) {
		this.setTrack(track);
	}
	if (cars instanceof Array) {
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
		json.cars
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
				car.pos = [];
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
				console.log('Sam, race over?');
				console.log('Sam, cars:', this.cars);
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
							car.lapTimes.push(this.time);
							if (car.lapTimes.length > this.laps) {
								// Finished!
								if (!this.finalStanding.includes(car.name)) {
									this.finalStanding.push(car.name);
								}
								const place = this.finalStanding.indexOf(car.name);
								if (car.x > this.gradients[0].x + (this.cars.length - place) * 10) {
									car.fx = car.x;
									car.fy = car.y;
								}
								return;
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

				if (car.x < this.extrema[x][0] - 10
					|| car.x > this.extrema[x][1] + 10
					|| car.y < this.extrema[y][0] - 10
					|| car.y > this.extrema[y][1] + 10) {
					console.log('Sam, car out of bounds!');
					this.simulation.stop();
				}
			});

			// Record positional data for future replay
			this.cars.forEach((car) => {
				car.pos.push({
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
		pos: [],
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

/* Documentation:
 * https://doc.babylonjs.com/babylon101/discover_basic_elements
 * https://doc.babylonjs.com/api/globals
 * https://doc.babylonjs.com/how_to/gui3d
 */

function buildReplay(raceTrack) {
	console.log('Sam, let\'s do this!');
	const {
		Animation,
		Color3,
		Color4,
		DirectionalLight,
		Engine,
		Mesh,
		MeshBuilder,
		Scene,
		SkyMaterial,
		StandardMaterial,
		Texture,
		UniversalCamera,
		Vector3,
	} = BABYLON;

	// First set the scene
	const canvas = document.querySelector('canvas#replay');
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);
	scene.useRightHandedSystem = true;
	scene.ambientColor = new Color3(0.7, 0.7, 0.7);

	// Build the sky
	const skyMaterial = new SkyMaterial('sky', scene);
	skyMaterial.backFaceCulling = false;
	skyMaterial.luminance = 0.1;
	skyMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
	skyMaterial.sunPosition = new Vector3(10, 3, 0);
	skyMaterial.turbidity = 2;
	skyMaterial.rayleigh = 3;
	skyMaterial.cameraOffset.y = 200;

	const skybox = Mesh.CreateBox('skyBox', 1000.0, scene);
	skybox.material = skyMaterial;

	// Add Light from Sun
	const sun = new DirectionalLight('light2', skyMaterial.sunPosition.negate(), scene);
	sun.diffuse = new Color3(0.8, 0.8, 0.8);
	sun.intensity = 0.5;

	const cameras = [
		new UniversalCamera('universalCamera1', new Vector3(-35, 160, 2 * raceTrack.extrema[y][1]), scene),
		new UniversalCamera('universalCamera2', new Vector3(raceTrack.extrema[x][1] + 10, 20, raceTrack.extrema[y][0] - 10), scene),
		new UniversalCamera('universalCamera3', new Vector3(raceTrack.extrema[x][0] - 10, 20, raceTrack.extrema[y][0] - 10), scene),
	];

	/*
	cameras.forEach((cam) => {
		cam.attachControl(canvas, false);
	});
	/**/

	const buffer = 10;
	let width = raceTrack.extrema[x][1] - raceTrack.extrema[x][0] + buffer * 2;
	let height = raceTrack.extrema[y][1] - raceTrack.extrema[y][0] + buffer * 2;

	if (height > width * 4 / 5) {
		width = height * 5 / 4;
	} else {
		height = width * 4 / 5;
	}

	// Define Surface Materials
	const ground = MeshBuilder.CreateGround('ground1', { height, width, subdivisions: 2 }, scene);
	ground.position = new Vector3(
		(raceTrack.extrema[x][1] + raceTrack.extrema[x][0]) / 2,
		-0.02,
		(raceTrack.extrema[y][1] + raceTrack.extrema[y][0]) / 2
	);
	const grass = new StandardMaterial('grass', scene);
	grass.diffuseColor = new Color3(0x56 / 0xff, 0x7d / 0xff, 0x46 / 0xff);
	grass.ambientColor = new Color3(0x56 / 0xff, 0x7d / 0xff, 0x46 / 0xff);
	ground.material = grass;
	const asphalt = new StandardMaterial('asphalt', scene);
	asphalt.diffuseColor = new Color3(0xb7 / 0xff, 0xb5 / 0xff, 0xba / 0xff);
	asphalt.ambientColor = new Color3(0xb7 / 0xff, 0xb5 / 0xff, 0xba / 0xff);
	const black = new StandardMaterial('black', scene);
	black.diffuseColor = new Color3(1 / 0xff, 1 / 0xff, 1 / 0xff);
	black.ambientColor = new Color3(1 / 0xff, 1 / 0xff, 1 / 0xff);
	const siding = new StandardMaterial('siding', scene);
	siding.diffuseColor = new Color3(0xeb / 0xff, 0x58 / 0xff, 0x63 / 0xff);
	siding.ambientColor = new Color3(0xeb / 0xff, 0x58 / 0xff, 0x63 / 0xff);

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
		for (let j = 0; j < 2; j++) {
			const pathArray = [
				path,
				trackArray[i],
			];
			if (j % 2) pathArray.reverse();
			const rail = MeshBuilder.CreateRibbon(`rail${i}${j}`, {
				pathArray,
				closePath: true,
			}, scene);
			rail.material = siding;
		}
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
		const pos = car.pos[0];
		car.sphere = MeshBuilder.CreateSphere('sphere', {
			segments: 16,
			diameter: car.radius * 2,
		}, scene);
		car.sphere.position = new Vector3(pos.x, car.radius, pos.y);

		if (car.rgb instanceof Array) {
			const material = new StandardMaterial(`${car.name}Material`, scene);
			material.diffuseColor = new Color3(...car.rgb.map(c => c / 0xff));
			material.ambientColor = new Color3(...car.rgb.map(c => c / 0xff));
			material.diffuseTexture = new Texture('ball.png', scene);
			car.sphere.material = material;
		}
	});

	// Build Replay Animation
	if (cars[0].pos.length > 1) {
		console.log('Sam, cars:', cars);

		const df = 3; // Frames between ticks
		const pi2 = Math.PI * 2;
		const pi180 = 180 / Math.PI;
		cars.forEach((car, i) => {
			let zr = 0;
			let yr = 0;

			const poKeys = [];
			const roKeys = [];
			const moveAnime = new Animation(`moveAnime${car.name}`, 'position', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
			const spinAnime = new Animation(`spinAnime${car.name}`, 'rotation', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
			car.pos.forEach((frame) => {
				// Animate car positions
				poKeys.push({
					frame: frame.tick * df,
					value: new Vector3(frame.x, car.radius, frame.y),
				});
				// Animate car rotation
				const v = Math.hypot(frame.vx, frame.vy);
				if (v > 0) {
					// Angle car is now pointed
					const α = -Math.sign(frame.vy) * Math.acos(frame.vx / v);
					// Get angle difference within one full rotation in either direction
					let d = α % pi2 - yr % pi2;
					// Reverse direction to avoid spinning the wrong way on a turn/bounce
					while (Math.abs(d) > Math.PI) d = d - Math.sign(d) * pi2;
					// Update angles
					yr += d;
					zr -= v * Math.PI / 16;
				}
				roKeys.push({
					frame: frame.tick * df,
					value: new Vector3(0, yr, zr),
				});
			});

			poKeys.push({
				frame: poKeys[poKeys.length - 1].frame + 120,
				value: poKeys[poKeys.length - 1].value,
			});
			roKeys.push({
				frame: roKeys[roKeys.length - 1].frame + 120,
				value: roKeys[roKeys.length - 1].value,
			});

			moveAnime.setKeys(poKeys);
			spinAnime.setKeys(roKeys);

			// Set functions to reset and restart animations
			car.sphere.animations = [moveAnime, spinAnime];

			// Set function to start animations
			setTimeout(() => {
				car.anime = scene.beginAnimation(car.sphere, 0, poKeys[poKeys.length - 1].frame, true);
			}, 1200);
		});
	}

	scene.activeCamera = cameras[0];

	scene.beforeRender = (...args) => {
		// console.log('Sam, beforeRender:', args);
	};
	const charlotte = cars.find(c => c.name === 'Charlotte');

	let j = 0;
	let k = 0;
	let n = 0;
	engine.runRenderLoop(() => {
		scene.render();
		j++;
		if (j % 500 === 1) {
			cameras[++n % cameras.length].lockedTarget = cars[k % cars.length].sphere;
			scene.activeCamera = cameras[n % cameras.length];
		} else if (j % 500 === 251) {
			cameras[++n % cameras.length].lockedTarget = cars[k++ % cars.length].sphere;
			scene.activeCamera = cameras[n % cameras.length];
		}
	});
	window.addEventListener('resize', () => {
		engine.resize();
	});
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
