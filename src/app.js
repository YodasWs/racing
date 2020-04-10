/* app.json */
const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;
const radius = 4;
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

	const raceTrack = new RaceTrack(svg, OvalCourse.map(piece => new TrackPiece(piece)), [
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
			rgb: [0, 0, 0],
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
});

const gravity = 1 / 5;

function TrackPiece(options) {
	Object.assign(this, {
		gradient: [1, 0],
		delta: [0, 0],
		width: 20,
		rail: [1/2, 1/2],
	}, options);

	const hypot = Math.hypot(...this.gradient)
	let α = Math.acos(this.gradient[x] / hypot);
	if (Math.sign(this.gradient[y]) === -1) {
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
				let a = Math.hypot(...acceleration);
				acceleration = acceleration.map(d => d / a);

				// If acceleration is pointed in the wrong direction, don't use it
				if (Math.hypot(node.vx, node.vy) !== 0 && Math.acos((
					acceleration[x] * node.vx + acceleration[y] * node.vy
				) / Math.hypot(...acceleration) / Math.hypot(node.vx, node.vy)) > Math.PI / 2) {
					acceleration = [0, 0];
				}

				// Add gradient to acceleration to more strongly force movement in that direction
				acceleration = acceleration.map((d, i) => d + piece.gradient[i]);

				// Normalize acceleration and scale by gravity
				a = Math.hypot(...acceleration);
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

function RaceTrack(svg, track, cars, options) {
	const simulation = d3.forceSimulation();

	Object.assign(this, {
		laps: 10,
	}, options, {
		gradients: [],
		rails: [],
		tick: 0,
		time: 0,
		pos: [],
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
			this.simulation.force('fCollide', d3.forceCollide(4));

			// Place Cars on Starting Line
			this.simulation.nodes().forEach((car, i) => {
				car.lapTimes = [];
				car.x = -10 * (i + 1);
				car.y = -3 * Math.pow(-1, i);
				// Start with some velocity to increase excitement at the start
				car.vx = 0.9;
				car.vy = 0;
				car.trackAhead = this.gradients.slice();
			});
			this.pos = [];
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
				console.log('Sam, replay:', this.pos);
				console.log('Sam, cars:', this.cars);
				this.simulation.stop();
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
				// TODO: Need to move this to a force
				// TODO: Need to construct force similar to d3.forceCollide
				this.rails.forEach((rail) => {
					const cp = closestPoint(rail, car);

					// Bounce!
					// TODO: Still need to determine if the car is moving fast enough to jump the railing
					// Simple: cp.distance <= Hypot(vx, vy)
					if (cp.distance <= car.radius || cp.distance <= Math.hypot(car.vx, car.vy)) {
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

						car.vx -= delta[x];
						car.vy -= delta[y];
					}
				});

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

						if (piece === 0) {
							car.lapTimes.push(this.time);
							if (car.lapTimes.length > this.laps) {
								// Finished!
								car.fx = this.extrema[x][0];
								car.fy = this.extrema[y][0];
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
			this.pos.push({
				tick: this.tick,
				time: this.time,
				cars: this.cars.map(c => ({
					name: c.name,
					vx: c.vx,
					vy: c.vy,
					x: c.x,
					y: c.y,
				})),
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
				if (Math.sign(grad.gradient[y]) === -1) {
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
			this.cars.sort((a, b) => {
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
					const lastTime = car.time[car.time.length - 1];

					if (i === 0) {
						leadPosition = car.time.slice();
					}

					const elTime = li.querySelector('.time');
					if (i === 0) {
						const time = ((lastTime.time - car.time[0].time) / 1000).toFixed(2);
						if (elTime.innerText !== time) elTime.innerText = time;
						elTime.classList.remove('fade-out');
					} else {
						const leadTime = leadPosition.filter(t => t.lap === lastTime.lap && t.piece === lastTime.piece)[0];
						if (leadPosition.indexOf(leadTime) !== leadPosition.length - 1) {
						}
						let time = (lastTime.time - leadTime.time) / 1000;
						if (time > 0) time = `+${time.toFixed(2)}`;
						else time = time.toFixed(2);
						if (elTime.innerText !== time) {
							elTime.classList.remove('fade-out');
							if (car.lapTimes.length < this.laps)
							setTimeout(() => {
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

function Car(name, options) {
	Object.assign(this, {
		strokeWidth: 1,
		r: 4,
	}, options, {
		trackAhead: [],
		nextPiece: false,
		previousPiece: false,
		lapTimes: [],
		time: [],
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

function buildReplay(raceTrack) {
	console.log('Sam, let\'s do this!');
	const {
		Color3,
		Engine,
		FreeCamera,
		HemisphericLight,
		MeshBuilder,
		Scene,
		StandardMaterial,
		Vector3,
	} = BABYLON;

	const canvas = document.querySelector('canvas#replay');
	const engine = new Engine(canvas, true);

	const scene = new Scene(engine);
	const camera = new FreeCamera('camera', new Vector3(-35, 80, -80), scene);
	camera.attachControl(canvas, false);
	const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

	const startPositions = raceTrack.pos[0].cars;
	const cars = raceTrack.cars;
	console.log('Sam, cars:', cars);
	console.log('Sam, startPositions:', startPositions);

	startPositions.forEach((pos) => {
		const car = cars.filter(c => c.name === pos.name)[0];
		console.log('Sam, car:', car);
		console.log('Sam, diameter:', car.radius * 2);
		const sphere = MeshBuilder.CreateSphere('sphere', {
			segments: 16,
			diameter: car.radius * 2,
		}, scene);
		if (car.name === 'Charlotte') {
			camera.setTarget(new Vector3(pos.x, car.radius, -pos.y));
		}
		sphere.position.x = pos.x;
		sphere.position.y = car.radius;
		sphere.position.z = -pos.y;

		const material = new StandardMaterial(`${car.name}Material`, scene);
		if (car.rgb instanceof Array) {
			material.diffuseColor = new Color3(...car.rgb.map(c => c / 0xff));
		} else {
			material.diffuseColor = new Color3(0, 1, 0);
		}
		sphere.material = material;
	});
	// camera.setTarget(new Vector3(-35, 4.5, 0));

	const buffer = 10;
	let width = raceTrack.extrema[x][1] - raceTrack.extrema[x][0] + buffer * 2;
	let height = raceTrack.extrema[y][1] - raceTrack.extrema[y][0] + buffer * 2;
    const ground = MeshBuilder.CreateGround('ground1', { height, width, subdivisions: 2 }, scene);

	engine.runRenderLoop(() => {
		scene.render();
	});
	window.addEventListener('resize', () => {
		engine.resize();
	});
}
