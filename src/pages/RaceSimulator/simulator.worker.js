importScripts('/res/d3.minjs');

class RaceTrack {
	#cars = [];
	#extrema = { x: [], y: [] };
	#finalStanding = [];
	#laps = 10;
	#sectors = [];
	#simulation = d3.forceSimulation();
	#rails = [];
	#tick = 0;
	#time = 0;

	constructor({
		cars = [],
		...options
	} = {}) {
		if (options.laps) this.#laps = options.laps;
		Object.assign(this, options);

		if (Array.isArray(cars) && cars.length > 0) {
			this.#simulation.nodes(cars);
			this.#cars = cars.slice();
		}

	}

	init() {
		this.#simulation.force('fCollide', d3.forceCollide(car => car.radius));
		this.#simulation.force('fRailing', forceRailingBounce(this.#rails));

		// Place Cars on Starting Line
		this.#simulation.nodes().forEach((car, i) => {
			car.lapTimes = [];
			car.x = -7 * (i + 1);
			car.y = 5 * Math.pow(-1, i);
			// Start with some velocity to increase excitement at the start
			car.vx = 0.9;
			car.vy = 0;
			car.trackAhead = this.#sectors.slice();
			car.posn = [];
		});
		this.#moveCars();
		this.#simulation.alphaDecay(0);
		this.#simulation.velocityDecay(0.01);

		this.#simulation.on('tick', () => {
			this.#onTick();
		});

		return this;
	}

	#onTick() {
		this.#simulation.nodes(this.#simulation.nodes());
		requestAnimationFrame((time) => {
			this.#time = time;
		});
		this.#tick++;
		this.#moveCars();

		// At end of race
		if (this.#cars.every(c => c.lapTimes.length > this.#laps)) {
			this.#simulation.stop();

			// Remove circular reference for conversion to JSON
			this.#cars.forEach((car) => {
				delete car.sphere;
			});

			postMessage({
				type: 'endRace',
				detail: JSON.stringify(this),
			});
		}
		return this;
	}

	#moveCars() {
		this.#simulation.nodes().forEach((car, i, nodes) => {
			if (car.nextPiece) {
				// Add to time-tracking only on first crossover in the lap
				const piece = this.#sectors.indexOf(car.trackAhead[0]);
				// TODO: Why is this sometimes not grabbing the time object?!
				// TODO: What could cause an extra push to lapTimes?!
				if (!car.time.some(t => t.lap === car.lapTimes.length && t.piece === piece)) {
					car.time.push({
						// TODO: point to index of car.posn with same tick
						lap: car.lapTimes.length,
						piece,
						tick: this.#tick,
						time: this.#time,
					});

					// Cross the start/end line, next lap
					if (piece === 0) {
						if (!this.#finalStanding.includes(car.name)) {
							const lastTime = car.time.slice(-1).pop();
							// if (lastTime) console.log('Sam, next lap!', this.#tick, `${car.name[0]}:${lastTime.lap}:${lastTime.piece}`);
							car.lapTimes.push({
								tick: this.#tick,
								time: this.#time,
							});
						}

						if (car.lapTimes.length > this.#laps) {
							// Finished!
							if (!this.#finalStanding.includes(car.name)) {
								this.#finalStanding.push(car.name);
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
			if (this.#finalStanding.includes(car.name)) {
				const place = this.#finalStanding.indexOf(car.name);

				car.y = Math.min(Math.max(-20, car.y), 20);

				if (car.x > this.#sectors[0].x + (this.#cars.length - place) * 10) {
					car.fx = car.x;
					car.fy = car.y;
				}
			}

			// Off track? Stop!
			if (car.x < this.#extrema[x][0] - 10
				|| car.x > this.#extrema[x][1] + 10
				|| car.y < this.#extrema[y][0] - 10
				|| car.y > this.#extrema[y][1] + 10) {
				this.#simulation.stop();
			}
		});

		// Record positional data for future replay
		this.#cars.forEach((car) => {
			car.posn.push({
				// TODO: if item was added to car.time, point to it
				tick: this.#tick,
				time: this.#time,
				vx: car.vx,
				vy: car.vy,
				x: car.x,
				y: car.y,
			});
		});

		return this;
	}

	get simulation() {
		return this.#simulation;
	}

	static fromJson(json) {
		return new RaceTrack(json);
	}
}

self.onmessage = (event) => {
	const raceTrack = new RaceTrack(event.data);
	raceTrack.init();
	raceTrack.simulation.alpha(1);
};
