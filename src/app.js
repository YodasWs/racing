/* app.json */
const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;

yodasws.page('home').setRoute({
	template: 'pages/home.html',
	route: '/',
}).on('load', () => {
	const svg = document.querySelector('svg#scene');

	const alice = new Car('Alice', {
		color: 'lightgreen',
		color2: 'orange',
	});

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
		},
		{
			gradient: [1, 1],
			delta: [27, 13],
			width: 20,
		},
		{
			gradient: [0, 1],
			delta: [13, 27],
			width: 20,
		},
		{
			gradient: [-1, 1],
			delta: [-13, 27],
			width: 20,
		},
		{
			gradient: [-1, 0],
			delta: [-27, 13],
			width: 20,
		},
		{
			gradient: [-1, 0],
			delta: [-120, 0],
			width: 20,
		},
		{
			gradient: [-1, -1],
			delta: [-27, -13],
			width: 20,
		},
		{
			gradient: [0, -1],
			delta: [-13, -27],
			width: 20,
		},
		{
			gradient: [1, -1],
			delta: [13, -27],
			width: 20,
		},
		{
			gradient: [1, 0],
			delta: [27, -13],
			width: 20,
		},
	].map(piece => new TrackPiece(piece));

	const raceTrack = new RaceTrack(svg, OvalCourse, [
		alice,
	]);
	console.log('Sam, raceTrack:', raceTrack);

	console.log('Sam, nodes:', raceTrack.simulation.nodes());
	raceTrack.simulation.stop();
	raceTrack.init();

	document.getElementById('btnStart').addEventListener('click', () => {
		console.log('Sam, start!');
		raceTrack.simulation.stop();
		raceTrack.init();
		raceTrack.simulation.alpha(1);
		setTimeout(() => {
			raceTrack.simulation.restart();
		}, 500);
	});

	document.getElementById('btnPause').addEventListener('click', (evt) => {
		switch (evt.currentTarget.innerText) {
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
		raceTrack.simulation.tick();
		raceTrack.onTick();
	});
});

let pieces;
const gravity = 1;

let j = 0;

function TrackPiece(options) {
	this.gradient = options.gradient || [1, 0];
	this.delta = options.delta || [0, 0];
	this.width = options.width || 20;

	const hypot = Math.hypot(...this.gradient)
	let α = Math.acos(this.gradient[x] / hypot);
	if (Math.sign(this.gradient[y]) === -1) {
		α = 2 * Math.PI - α;
	}
	this.α = α;

	this.j = j++;

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
				console.log('Sam, 1, acceleration:', acceleration);

				// TODO: If pointed away from line, need a strong force toward nearest endpoint
				// Um, this pushes v to g, which then leaves a oscillating back and forth!
				// TODO: cos θ = a*v/|a||v|, then adjust to give -π/2 < θ < π/2

				// If acceleration is pointed in the wrong direction, invert it
				if (Math.hypot(node.vx, node.vy) !== 0) {
					let θ = Math.acos((
						acceleration[x] * node.vx
						+ acceleration[y] * node.vy
					) / Math.hypot(...acceleration) / Math.hypot(node.vx, node.vy));

					if (θ > Math.PI / 2) {
						acceleration = [0, 0];

						/*
						// Negate acceleration
						acceleration = acceleration.map(d => -d);
						console.log('Sam, θ:', θ * 180 / Math.PI);
						console.log('Sam, 2, acceleration:', acceleration);

						if (θ < Math.PI) {
							// Vector perpendicular to velocity, normalized
							let p = [];
							if (node.vy !== 0) {
								p = [-1, node.vx / node.vy];
								p = p.map(d => d / Math.hypot(...p));
								console.log('Sam, p:', p);
							} else if (piece.gradient[y] !== 0) {
								console.log('Sam, v:', node.vx, node.vy);
								p = [0, Math.sign(piece.gradient[y]) * node.vx];
								console.log('Sam, p:', p);
								p = p.map(d => d / Math.hypot(...p));
								console.log('Sam, p:', p);
							}

							// Dot product
							const dp = acceleration[x] * p[x] + acceleration[y] * p[y];
							acceleration = acceleration.map((d, i) => d - 2 * dp * p[i]);
							console.log('Sam, 3, acceleration:', acceleration);
						}
						/**/
					}
				}

				// Add gradient to acceleration to more strongly force movement in that direction
				acceleration = acceleration.map((d, i) => d + piece.gradient[i]);

				// Normalize acceleration and scale by gravity
				a = Math.hypot(...acceleration);
				acceleration = acceleration.map(d => d / a);
				node.vx += gravity * acceleration[x] * alpha;
				node.vy += gravity * acceleration[y] * alpha;

				console.log('Sam, on piece', piece.j);
				console.log('Sam, 4 acceleration:', acceleration);
				console.log('Sam, v:', node.vx, node.vy);
				console.log('Sam, node:', node.x, node.y);

				const nextPosition = [node.x + node.vx, node.y, node.vy];
				console.log('Sam, nextPosition:', nextPosition[x], nextPosition[y]);

				// Determine when the car moves off this piece and onto the next
				if (typeof piece.m === 'number'
					&& typeof piece.b === 'number'
					// If not vertical
					&& Math.abs(piece.m) < Number.POSITIVE_INFINITY
				) {
					const y0 = piece.m * nextPosition[x] + piece.b;
					console.log('Sam, y0,', piece.m, nextPosition[x], piece.b);
					if (piece.α > 0 && piece.α < Math.PI && y0 < nextPosition[y]) {
						node.nextPiece = true;
					}
					if (piece.α > Math.PI && y0 > nextPosition[y]) {
						node.nextPiece = true;
					}
					if (node.nextPiece) {
						console.log('Sam, nextPiece,', piece.α * 180 / Math.PI, y0, nextPosition[y], piece.α);
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
			});
		}

		force.initialize = (_) => {
			nodes = _;
		};

		return force;
	})();
}

function RaceTrack(svg, track, cars) {
	const simulation = d3.forceSimulation();

	this.gradients = [];

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

			// TODO: Place Cars on Starting Line
			this.simulation.nodes().forEach((car, i) => {
				car.x = -10;
				car.y = 0;
				car.vx = 0;
				car.vy = 0;
				car.trackAhead = this.gradients.slice();
				pieces = this.gradients.slice();
			});
			this.moveCars();
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
			// TODO: Build forces that don't require this expense of power
			this.simulation.nodes(this.simulation.nodes());
			this.moveCars();
			if (Math.abs(this.simulation.nodes()[0].vx) < 0.005
				&& Math.abs(this.simulation.nodes()[0].vy) < 0.005) {
				this.simulation.stop();
				console.log('Sam, stopped!');
			}
		},
	},
	moveCars: {
		value() {
			// TODO: Discern which piece of track the car is on
			// Move Cars!
			d3.selectAll('#gCars circle').attr('cx', d => d.x).attr('cy', d => d.y);
			this.simulation.nodes().forEach((car) => {
				car.x
				car.y
				car.trackAhead[0]

				if (car.nextPiece) {
					console.log('Sam, change track piece!');
					car.trackAhead.push(...car.trackAhead.splice(0, 1));
					console.log('Sam, now on piece', pieces.indexOf(car.trackAhead[0]));
					console.log('Sam, trackAhead:', car.trackAhead);
					car.nextPiece = false;
				}

				if (car.x < this.extrema[x][0] - 10
					|| car.x > this.extrema[x][1] + 10
					|| car.y < this.extrema[y][0] - 10
					|| car.y > this.extrema[y][1] + 10) {
					console.log('Sam, car out of bounds!');
					this.simulation.stop();
				}
			});
		},
	},
	setTrack: {
		enumerable: true,
		value(track) {
			this.gradients = track.filter(piece => piece instanceof TrackPiece);

			// Add Track Pieces to SVG
			let buildPosition = [0, 0];
			const extrema = [[0, 0], [0, 0]];
			const rails = [[], []];

			this.gTrack.innerHTML = '';
			this.gradients.forEach((grad, i) => {
				// Move build position
				buildPosition[x] += grad.delta[x];
				buildPosition[y] += grad.delta[y];

				grad.x = buildPosition[x];
				grad.y = buildPosition[y];
				d3.select('svg #gTrack').append('circle')
					.attr('cx', grad.x).attr('cy', grad.y)
					.attr('r', 2).attr('fill', 'red');

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
				grad.b = grad.m * points.x1 + points.y1;

				// Draw line
				const elLine = document.createElementNS(SVG, 'line');
				rails[0].push([points.x1, points.y1]);
				rails[1].push([points.x2, points.y2]);

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
			});

			this.extrema = extrema;

			// Draw railings along track
			rails.forEach((rail) => {
				rail.push(rail[0]);
				const elLine = document.createElementNS(SVG, 'path');
				const d = [];
				rail.forEach((point) => {
					d.push(point.join(','));
				});
				elLine.setAttribute('d', 'M' + d.join('L'));
				this.gTrack.appendChild(elLine);
			});

			// Adjust SVG View Box
			let width = extrema[x][1] - extrema[x][0] + 20;
			let height = extrema[y][1] - extrema[y][0] + 20;
			let x0 = extrema[x][0] - 10;
			let y0 = extrema[y][0] - 10;

			if (width > height) {
				height = width * 4 / 5;
				y0 = (extrema[y][0] + extrema[y][1] - height) / 2;
			} else {
				width = height * 5 / 4;
				x0 = (extrema[x][0] + extrema[x][1] - height) / 2;
			}

			this.svg.setAttribute('viewBox', `${x0} ${y0} ${width} ${height}`);

			return this;
		},
	},
	setCars: {
		enumerable: true,
		value(cars) {
			d3.select('svg #gCars').selectAll('circle')
				.data(cars).enter().append('circle').classed('car', true)
				.attr('fill', d => d.color).attr('stroke', d => d.color2)
				.attr('cx', d => d.x).attr('cy', d => d.y);
			this.simulation.nodes(cars);
			return this;
		},
	},
});

function Car(name, options) {
	const ele = document.createElementNS(SVG, 'circle');
	ele.classList.add('car');

	if (typeof options.color === 'string') {
		ele.setAttribute('fill', options.color);
	}

	if (typeof options.color2 === 'string') {
		ele.setAttribute('stroke-width', '0.5px');
		ele.setAttribute('stroke', options.color2);
	}

	this.trackAhead = [];

	let nextPiece = false;

	Object.assign(this, options);
	Object.defineProperties(this, {
		name: {
			enumerable: true,
			get: () => name,
		},
		ele: {
			get: () => ele,
		},
		nextPiece: {
			set(val) {
				if (typeof val === 'boolean') {
					nextPiece = val;
				}
			},
			get: () => nextPiece,
		},
	});
}
Object.defineProperties(Car.prototype, {
});
