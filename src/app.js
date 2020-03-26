/* app.json */
const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;

yodasws.page('home').setRoute({
	template: 'pages/home.html',
	route: '/',
}).on('load', () => {
	const svg = document.querySelector('svg#scene');
	const raceTrack = new RaceTrack(svg);
	console.log('Sam, raceTrack:', raceTrack);
	raceTrack.draw();
});

function Gradient(start, end, strength = 1) {
	this.strength = strength;
	this.start = start;
	this.end = end;
}

function TrackPiece(style) {
	switch (style) {
		case 'curve':
			this.gradient = new Gradient([1, 0], [0, 1]);
			break;
		case 'straight':
		default:
			this.gradient = new Gradient([1, 0], [1, 0]);
	}
}

function RaceTrack(svg) {
	const pieces = [];
	const gradients = [
		{
			gradient: [1, 0],
			delta: [0, 0],
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
			gradient: [1, -1],
			delta: [-27, -13],
			width: 20,
			up: true,
		},
		{
			gradient: [0, -1],
			delta: [-13, -27],
			width: 20,
			up: true,
		},
		{
			gradient: [-1, -1],
			delta: [13, -27],
			width: 20,
			up: true,
		},
		{
			gradient: [1, 0],
			delta: [27, -13],
			width: 20,
		},
	];

	Object.defineProperties(this, {
		pieces: {
			enumerable: true,
			value: pieces,
		},
		gradients: {
			get: () => gradients,
		},
		svg: {
			get: () => svg,
		},
	})
}
Object.defineProperties(RaceTrack.prototype, {
	draw: {
		enumerable: true,
		value() {
			let buildPosition = [0, 0];
			const extrema = [[0, 0], [0, 0]];
			const rails = [[], []];

			this.gradients.forEach((grad, i) => {
				// Move build position
				buildPosition[x] += grad.delta[x];
				buildPosition[y] += grad.delta[y];

				// Rotate to gradient
				let α = Math.acos(grad.gradient[x] / Math.hypot(...grad.gradient));
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
				this.svg.appendChild(elLine);
			});

			rails.forEach((rail) => {
				rail.push(rail[0]);
				const elLine = document.createElementNS(SVG, 'path');
				const d = [];
				rail.forEach((point) => {
					d.push(point.join(','));
				});
				elLine.setAttribute('d', 'M' + d.join('L'));
				this.svg.appendChild(elLine);
			});

			console.log('Sam, extrema:', extrema);
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

			this.svg.setAttribute(
				'viewBox',
				`${x0} ${y0}
				${width} ${height}`
				.replace(/\s+/g, ' '),
			);
		},
	},
});
