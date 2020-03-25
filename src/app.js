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
			width: 5,
		},
		{
			gradient: [1, 0],
			width: 7,
		},
		{
			gradient: [1, 0],
			width: 10,
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
			let buildOrientation = [1, 0];
			this.gradients.forEach((grad) => {
				// Set Standard Start Line
				const line = document.createElementNS(SVG, 'line');
				line.setAttribute('x1', buildPosition[x]);
				line.setAttribute('x2', buildPosition[x]);
				line.setAttribute('y1', buildPosition[y] - grad.width);
				line.setAttribute('y2', buildPosition[y] + grad.width);
				line.classList.add('checkpoint');
				this.svg.appendChild(line);
				buildPosition[x] += 10;
			});
		},
	},
});
