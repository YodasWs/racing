import TrackPiece from './TrackPiece.mjs';

const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;
const z = 2;

// TODO: Instead, build an array of points
function listPoints(pathNode, precision = 1/2) {
	const pathLength = pathNode.getTotalLength();
	const points = [];

	// Linear scan for coarse approximation
	for (let scanLength = 0; scanLength <= pathLength; scanLength += precision) {
		const point = pathNode.getPointAtLength(scanLength);
		points.push([point.x, point.y]);
	}

	return points;
}

function RaceTrack(svg, cars, options = {}) {
	const simulation = d3.forceSimulation();

	Object.assign(this, {
		laps: 10,
	}, options, {
		sectors: [],
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

	if (Array.isArray(options.sectors)) {
		this.setTrack(options.sectors.map((piece, i) => new TrackPiece(piece, i)));
	} else if (Array.isArray(options.trackPieces)) {
		this.setTrack(options.trackPieces.map((piece, i) => new TrackPiece(piece, i)));
	}
	if (Array.isArray(cars)) {
		this.setCars(cars);
	}
}

RaceTrack.fromJson = (json, svg = null) => {
	if (!(svg instanceof SVGElement)) {
		svg = document.querySelector('svg');
	}

	// function RaceTrack(svg, cars, options)
	return new RaceTrack(
		svg,
		json.cars,
		json,
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

			this.moveCars();
			this.listCars();

			return this;
		},
	},
	moveCars: {
		// Move Cars!
		value() {
			d3.selectAll('#gCars circle').attr('cx', d => d.x).attr('cy', d => d.y);

			// Record positional data for future replay
			this.cars.forEach((car) => {
				car.posn.push({
					// TODO: if item was added to car.time, point to it
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
			this.sectors = track.filter(piece => piece instanceof TrackPiece);

			// Add Track Pieces to SVG
			const buildPosition = [0, 0];
			const extrema = [[0, 0], [0, 0]];
			const railPoints = [[], []];
			this.rails = [];

			const centerPoints = [];

			this.gTrack.innerHTML = '';
			this.sectors.forEach((grad, i) => {
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

				grad.rail.forEach((r, j, a) => {
					if (typeof r === 'number') a[j] = [r, r];
				});

				const left = 0;
				const right = 1;
				const before = 0;
				const after = 1;

				// Get points for rails
				const railLeft = {
					before: [
						points.x1 - grad.width * Math.cos(α) * grad.rail[left][before],
						points.y1 - grad.width * Math.sin(α) * grad.rail[left][before],
					],
					is: [
						points.x1,
						points.y1,
					],
					after: [
						points.x1 + grad.width * Math.cos(α) * grad.rail[left][after],
						points.y1 + grad.width * Math.sin(α) * grad.rail[left][after],
					],
				};
				const railRight = {
					before: [
						points.x2 - grad.width * Math.cos(α) * grad.rail[right][before],
						points.y2 - grad.width * Math.sin(α) * grad.rail[right][before],
					],
					is: [
						points.x2,
						points.y2,
					],
					after: [
						points.x2 + grad.width * Math.cos(α) * grad.rail[right][after],
						points.y2 + grad.width * Math.sin(α) * grad.rail[right][after],
					],
				};
				railPoints[left].push(railLeft);
				railPoints[right].push(railRight);

				// Expand extrema of track layout
				extrema[x][0] = Math.min(extrema[x][0], points.x1, points.x2);
				extrema[x][1] = Math.max(extrema[x][1], points.x1, points.x2);
				extrema[y][0] = Math.min(extrema[y][0], points.y1, points.y2);
				extrema[y][1] = Math.max(extrema[y][1], points.y1, points.y2);

				// Draw line to SVG
				const elLine = document.createElementNS(SVG, 'line');
				Object.entries(points).forEach(([attr, num]) => {
					elLine.setAttribute(attr, num);
				});
				elLine.classList.add('checkpoint');
				if (i === 0) {
					elLine.classList.add('start-line');
				}
				this.gTrack.appendChild(elLine);

				// Add dot to center track
				d3.select('svg #gTrack').append('circle')
					.attr('cx', grad.x).attr('cy', grad.y)
					.attr('r', i === 0 ? 1.5 : 2).attr('fill', grad.color || 'whitesmoke')
					.attr('strokeWidth', i === 0 ? '0.5px' : '0')
					.attr('stroke', i === 0 ? 'white' : 'none');

				// TODO: Calculate borders of piece for geofencing
			});

			// Build rails for each sector separately
			railPoints.forEach((rail, j) => {
				// rail.push(rail[0]); // Close the loop
				rail.forEach((sector, i) => {
					this.rails[i] ??= [];
					const lastSector = i === 0 ? rail.length -1 : i - 1;
					const elLine = document.createElementNS(SVG, 'path');
					const d = [];
					d.push(`M${rail[lastSector].is.join(' ')}`);
					d.push(`C${[
						rail[lastSector].after.join(' '),
						sector.before.join(' '),
						sector.is.join(' '),
					].join(',')}`);
					elLine.setAttribute('d', d.join(''));
					this.gTrack.appendChild(elLine);
					// Convert into array of points
					this.rails[i][j] = listPoints(elLine);
				});
			});

			this.extrema = extrema;

			// Adjust SVG View Box
			const buffer = 10;
			let width = extrema[x][1] - extrema[x][0] + buffer * 2;
			let height = extrema[y][1] - extrema[y][0] + buffer * 2;
			let x0 = extrema[x][0] - buffer;
			let y0 = extrema[y][0] - buffer;

			// Maintain aspect ratio of 4:5
			if (height > width * 4 / 5) {
				width = height * 5 / 4;
				x0 = (extrema[x][0] + extrema[x][1] - width) / 2;
			} else {
				height = width * 4 / 5;
				y0 = (extrema[y][0] + extrema[y][1] - height) / 2;
			}

			this.svg.setAttribute('viewBox', `${x0} ${y0} ${width} ${height}`);

			// Center line around track
			// TODO: A true center line would be built like the railings
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

			const outputLaps = document.querySelector('output#lapCount');
			const ol = document.querySelector('ol#positions');
			this.cars.slice().sort((a, b) => {
				if (a.time.length === 0 && b.time.length === 0) return 0;
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

					// TODO: Why is this sometimes not grabbing the lead position object?!
					// Get times of the lead car
					if (i === 0) {
						leadPosition = car.time.slice();
						outputLaps.innerHTML = `Lap ${car.lapTimes.length} of ${this.laps}`;
					}

					const elTime = li.querySelector('.time');
					if (i === 0) {
						const time = ((lastTime.time - car.time[0].time) / 1000).toFixed(2);
						if (elTime.innerText !== time) elTime.innerText = time;
						elTime.classList.remove('fade-out');
					} else {
						// TODO: Why is this sometimes not grabbing the lead position object?!
						const leadTime = leadPosition.filter(t => t.lap === lastTime.lap && t.piece === lastTime.piece)
							.sort((a, b) => a.time - b.time)[0];
						if (!lastTime) console.error('lastTime:', lastTime);
						if (!leadTime) console.error('leadTime:', leadTime);
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

export default RaceTrack;
