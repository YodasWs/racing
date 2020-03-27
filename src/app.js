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
			right: true,
		},
		{
			gradient: [0, -1],
			delta: [-13, -27],
			width: 20,
			up: true,
		},
		{
			gradient: [1, -1],
			delta: [13, -27],
			width: 20,
			left: true,
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
});

let pieces;
const forceMultiplier = 0.1;

function TrackPiece(options) {
	this.gradient = options.gradient || [1, 0];
	this.delta = options.delta || [0, 0];
	this.width = options.width || 20;
	this.right = options.right || false;
	this.left = options.left || false;
	this.up = options.up || false;

	const hypot = Math.hypot(...this.gradient)
	let α = Math.acos(this.gradient[x] / hypot);
	if (this.left) α -= Math.PI / 2;
	if (this.right) α += Math.PI / 2;
	if (this.up) α += Math.PI;
	this.α = α;

	// Don't apply X-force on horizontal lines
	if (![
		-Math.PI / 2,
		Math.PI / 2,
		3 * Math.PI / 2,
	].some(a => Math.abs(α - a) < Number.EPSILON)) {
		this.fx = d3.forceX().x((node, i) => {
			return this.x;
		}).strength((node, i) => {
			// TODO: Do not apply to Cars outside piece
			if (node.trackAhead.length === 0) return 0;
			if (node.trackAhead[0] !== this) return 0;
			console.log('Sam, using strength', pieces.indexOf(node.trackAhead[0]), 'x');
			return hypot * Math.cos(α) * forceMultiplier;
		});
	}

	// Don't apply Y-force on vertical lines
	if (![
		0,
		Math.PI,
		2 * Math.PI,
	].some(a => Math.abs(α - a) < Number.EPSILON)) {
		this.fy = d3.forceY().y((node, i) => {
			return this.y;
		}).strength((node, i) => {
			// TODO: Do not apply to Cars outside piece
			if (node.trackAhead.length === 0) return 0;
			if (node.trackAhead[0] !== this) return 0;
			console.log('Sam, using strength', pieces.indexOf(node.trackAhead[0]), 'x');
			return hypot * Math.sin(α) * forceMultiplier;
		});
	}
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

			// TODO: Place Cars on Starting Line
			this.simulation.nodes().forEach((car, i) => {
				car.x = -10;
				car.y = 0;
				car.vx = 0;
				car.vy = 0;
				this.simulation.force(`car${i}Collide`, car.fCollide);
				car.trackAhead = this.gradients.slice();
				pieces = this.gradients.slice();
			});
			this.moveCars();
			this.simulation.alphaDecay(0);

			this.simulation.on('tick', () => {
				this.simulation.nodes(this.simulation.nodes());
				console.log('hi sam');
				this.moveCars();
				if (Math.abs(this.simulation.nodes()[0].vx) < 0.005
					&& Math.abs(this.simulation.nodes()[0].vy) < 0.005) {
					this.simulation.stop();
					console.log('Sam, stopped!');
				}
			});

			return this;
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

			if (car.trackAhead[0].α > -Math.PI / 2 && car.trackAhead[0].α < Math.PI / 2 && car.x > car.trackAhead[0].x) {
				car.nextPiece = true;
			}
			if (car.trackAhead[0].α > Math.PI / 2 && car.x < car.trackAhead[0].x) {
				car.nextPiece = true;
			}
			if (car.trackAhead[0].α > 0 && car.trackAhead[0].α < Math.PI && car.y > car.trackAhead[0].y) {
				car.nextPiece = true;
			}
			if ((car.trackAhead[0].α < 0 || car.trackAhead[0].α > Math.PI) && car.y < car.trackAhead[0].y) {
				car.nextPiece = true;
			}

				if (car.nextPiece) {
					console.log('Sam, change track piece!');
					car.trackAhead.push(car.trackAhead.splice(0, 1));
					car.nextPiece = false;
				}

				if (car.x < this.extrema[x][0]
				|| car.x > this.extrema[x][1]
				|| car.y < this.extrema[y][0]
				|| car.y > this.extrema[y][1]) {
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
				if (grad.fx) {
					// grad.fx.x(grad.x);
					this.simulation.force(`piece${i}x`, grad.fx);
				}
				if (grad.fy) {
					// grad.fy.y(grad.y);
					this.simulation.force(`piece${i}y`, grad.fy);
				}

				// Rotate to gradient
				let α = Math.acos(grad.gradient[x] / Math.hypot(...grad.gradient));
				if (grad.left) α -= Math.PI / 2;
				if (grad.right) α += Math.PI / 2;
				if (grad.up) α += Math.PI;
				const points = {
					x1: buildPosition[x] + grad.width * Math.sin(α),
					y1: buildPosition[y] - grad.width * Math.cos(α),
					x2: buildPosition[x] - grad.width * Math.sin(α),
					y2: buildPosition[y] + grad.width * Math.cos(α),
				};

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

	this.fCollide = d3.forceCollide(4);
}
Object.defineProperties(Car.prototype, {
});
