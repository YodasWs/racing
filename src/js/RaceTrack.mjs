import TrackPiece from './TrackPiece.mjs';
import forceRailingBounce from './forceRailingBounce.mjs';

const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;
const z = 2;

function RaceTrack(svg, cars, options = {}) {
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

	if (Array.isArray(options.gradients)) {
		this.setTrack(options.gradients.map(piece => new TrackPiece(piece)));
	} else if (Array.isArray(options.trackPieces)) {
		this.setTrack(options.trackPieces.map(piece => new TrackPiece(piece)));
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

			// At end of race
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

				/*
				document.querySelectorAll('svg, ol, form').forEach((el) => {
					el.setAttribute('hidden', true);
				});
				document.querySelector('canvas#replay').removeAttribute('hidden');
				/**/

				window.dispatchEvent(new CustomEvent('raceEnd', {
					detail: [this],
				}));
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

				/*
				if (this.tick % 5 === 0) {
					const lastTime = car.time.slice(-1).pop();
					// console.log('Sam,', this.tick, `${car.name[0]}:${car.lapTimes.length}:${piece}`);
					if (lastTime) console.log('Sam,', this.tick, `${car.name[0]}:${lastTime.lap}:${lastTime.piece}`);
				}
				/**/

				if (car.nextPiece) {
					// Add to time-tracking only on first crossover in the lap
					const piece = this.gradients.indexOf(car.trackAhead[0]);
					// TODO: Why is this sometimes not grabbing the time object?!
					// TODO: What could cause an extra push to lapTimes?!
					if (!car.time.some(t => t.lap === car.lapTimes.length && t.piece === piece)) {
						car.time.push({
							// TODO: point to index of car.posn with same tick
							lap: car.lapTimes.length,
							piece,
							tick: this.tick,
							time: this.time,
						});

						// Cross the start/end line, next lap
						if (piece === 0) {
							if (!this.finalStanding.includes(car.name)) {
								const lastTime = car.time.slice(-1).pop();
								// if (lastTime) console.log('Sam, next lap!', this.tick, `${car.name[0]}:${lastTime.lap}:${lastTime.piece}`);
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

				grad.rail.forEach((r, i, a) => {
					if (typeof r === 'number') a[i] = [r, r];
				});

				const left = 0;
				const right = 1;
				const before = 0;
				const after = 1;

				// Draw line
				const elLine = document.createElementNS(SVG, 'line');
				railPoints[left].push({
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
				});
				railPoints[right].push({
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

			const outputLaps = document.querySelector('output#lapCount');
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
