/* app.json */
const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;

yodasws.page('home').setRoute({
	template: 'pages/home.html',
	route: '/',
}).on('load', () => {
	const svg = document.querySelector('svg#scene');

	const simulation = d3.forceSimulation();
	const alice = new Car('Alice', {
		color: 'lightgreen',
		color2: 'orange',
	});
	simulation.nodes([
		alice,
	]);

	const raceTrack = new RaceTrack(svg);
	console.log('Sam, raceTrack:', raceTrack);
	raceTrack.draw();
	alice.addToSVG(svg);
});

function TrackPiece(options) {
	this.gradient = options.gradient || [1, 0];
	this.delta = options.delta || [0, 0];
	this.width = options.width || 20;
	this.right = options.right || false;
	this.left = options.left || false;
	this.up = options.up || false;
}

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
];

function RaceTrack(svg) {
	const gradients = [];
	OvalCourse.forEach((piece) => {
		gradients.push(new TrackPiece(piece));
	});

	const gTrack = document.createElementNS(SVG, 'g');
	gTrack.setAttribute('id', 'trackPieces');

	const gCars = document.createElementNS(SVG, 'g');
	gCars.setAttribute('id', 'gCars');

	if (svg instanceof SVGElement) {
		svg.appendChild(gTrack);
		svg.appendChild(gCars);
	}

	Object.defineProperties(this, {
		gradients: {
			get: () => gradients,
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
	})
}
Object.defineProperties(RaceTrack.prototype, {
	draw: {
		enumerable: true,
		value() {
			if (!(this.svg instanceof SVGElement)) {
				throw new Error('draw requires valid svg element!');
			}

			if (!document.getElementById('trackPieces')) {
				this.svg.appendChild(this.gTrack);
				this.svg.appendChild(this.gCars);
			}

			let buildPosition = [0, 0];
			const extrema = [[0, 0], [0, 0]];
			const rails = [[], []];

			this.gradients.forEach((grad, i) => {
				// Move build position
				buildPosition[x] += grad.delta[x];
				buildPosition[y] += grad.delta[y];

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

	Object.defineProperties(this, {
		name: {
			enumerable: true,
			get: () => name,
		},
		ele: {
			get: () => ele,
		},
	});
}
Object.defineProperties(Car.prototype, {
	addToSVG: {
		enumerable: true,
		value(svg) {
			svg.getElementById('gCars').appendChild(this.ele);
			return this;
		},
	},
});
