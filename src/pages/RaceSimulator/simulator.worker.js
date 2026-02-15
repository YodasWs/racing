importScripts('/res/d3.min.js');

const debugInterval = 1;
const gravity = 1 / 7;
const correctiveStrength = 1 / 50;
const dt = 0.01;
const x = 0;
const y = 1;
const z = 2;

function closestSegments(P0, P1, A, B) {
	const ux = P1[0] - P0[0];
	const uy = P1[1] - P0[1];
	const vx = B[0] - A[0];
	const vy = B[1] - A[1];
	const wx0 = P0[0] - A[0];
	const wy0 = P0[1] - A[1];

	const a = ux * ux + uy * uy;       // |u|^2
	const b = ux * vx + uy * vy;       // u·v
	const c = vx * vx + vy * vy;       // |v|^2
	const d = ux * wx0 + uy * wy0;     // u·w0
	const e = vx * wx0 + vy * wy0;     // v·w0

	const D = a * c - b * b;           // denominator

	let sN, sD = D;
	let tN, tD = D;

	if (D < Number.EPSILON) {
		// Segments almost parallel: choose s = 0, project A onto u
		sN = 0;
		sD = 1;
		tN = e;
		tD = c;
	} else {
		sN = (b * e - c * d);
		tN = (a * e - b * d);
		if (sN < 0) {
			sN = 0;
			tN = e;
			tD = c;
		} else if (sN > sD) {
			sN = sD;
			tN = e + b;
			tD = c;
		}
	}

	if (tN < 0) {
		tN = 0;
		if (-d < 0) {
			sN = 0;
		} else if (-d > a) {
			sN = sD;
		} else {
			sN = -d;
			sD = a;
		}
	} else if (tN > tD) {
		tN = tD;
		if (-d + b < 0) {
			sN = 0;
		} else if (-d + b > a) {
			sN = sD;
		} else {
			sN = -d + b;
			sD = a;
		}
	}

	const sc = (Math.abs(sN) < Number.EPSILON ? 0 : sN / sD);
	const tc = (Math.abs(tN) < Number.EPSILON ? 0 : tN / tD);

	const cx = P0[0] + sc * ux;
	const cy = P0[1] + sc * uy;
	const qx = A[0] + tc * vx;
	const qy = A[1] + tc * vy;

	const dx = cx - qx;
	const dy = cy - qy;
	const dist = Math.hypot(dx, dy);

	return { dist, sc, tc, cx, cy, qx, qy, ux, uy, vx, vy };
}

function forceRailingBounce(rails) {
	let nodes = [];

	function force(alpha) {
		nodes.forEach((car) => {
			const P0 = [car.x, car.y];
			const P1 = [car.x + car.vx, car.y + car.vy];

			let bestHit = null;
			let bestS = 1; // earliest along motion

			const sectorRails = rails[car.sector];
			if (!sectorRails) return;

			sectorRails.forEach((rail) => {
				for (let i = 0; i < rail.length - 1; i++) {
					const A = rail[i];
					const B = rail[i + 1];

					const hit = closestSegments(P0, P1, A, B);
					// hit.dist = distance between closest points on the two segments
					// hit.sc   = param along P0->P1
					if (hit.dist <= car.radius && hit.sc >= 0 && hit.sc <= 1) {
						if (hit.sc < bestS) {
							bestS = hit.sc;
							bestHit = { ...hit, A, B };
						}
					}
				}
			});

			if (!bestHit) return; // no collision this tick

			// Position at collision along marble path
			const cx = P0[0] + bestHit.sc * bestHit.ux;
			const cy = P0[1] + bestHit.sc * bestHit.uy;

			// Closest point on rail at that time
			const qx = bestHit.qx;
			const qy = bestHit.qy;

			// Normal vector of rail segment
			const abx = bestHit.B[0] - bestHit.A[0];
			const aby = bestHit.B[1] - bestHit.A[1];
			let nx = -aby;
			let ny =  abx;
			const nLen = Math.hypot(nx, ny);
			if (nLen === 0) {
				// Can't determine normal, so skip bounce
				if (abx === 0) {
					// Degenerate vertical segment, normal is horizontal
					nx = 0;
					ny = Math.sign(car.x - bestHit.A[0]);
				} else if (aby === 0) {
					// Degenerate horizontal segment, normal is vertical
					nx = Math.sign(car.y - bestHit.A[1]);
					ny = 0;
				}
			} else {
				nx /= nLen;
				ny /= nLen;
			}

			// Vector from rail to marble at collision
			let rx = car.x - qx;
			let ry = car.y - qy;
			let rLen = Math.hypot(rx, ry);
			if (rLen === 0) {
			} else {
				// rx /= rLen;
				// ry /= rLen;
			}

			const dotRailToCar = rx * nx + ry * ny;

			// Point normal in same direction from the railing as the car
			if (dotRailToCar < 0) {
				// Normal is pointed in the wrong direction!
				nx = -nx;
				ny = -ny;
			}

			// Bounce only if car is moving into rail
			const dot = car.vx * nx + car.vy * ny;

			if (dot > 0) {
				// We're already moving in the correct direction!
				return;
			}

			// Normalize Vector from rail to marble at collision
			if (rLen === 0) {
				// Degenerate: fall back to rail normal
				rx = nx;
				ry = ny;
			} else {
				rx /= rLen;
				ry /= rLen;
			}

			// Place marble exactly radius away from rail along this direction
			const slop = Math.random() * 0.09 + 0.01; // small extra push to prevent sticking
			car.x = qx + rx * (car.radius + slop);
			car.y = qy + ry * (car.radius + slop);

			// Reflect velocity across the normal
			if (dot < 0) {
				car.vx -= 2 * dot * nx;
				car.vy -= 2 * dot * ny;
			} else {
				car.vx += Number.EPSILON * nx;
				car.vy += Number.EPSILON * ny;
			}

			// Remove any velocity into the rail to prevent sticking
			const inward = car.vx * nx + car.vy * ny;
			if (inward < 0) {
				car.vx -= inward * nx;
				car.vy -= inward * ny;
			}
		});

		// Optional: clamp speed to avoid crazy energy growth
		const maxV = 1; // or whatever feels right
		nodes.forEach((car) => {
			const v = Math.hypot(car.vx, car.vy);
			if (v > maxV) {
				car.vx = car.vx / v * maxV;
				car.vy = car.vy / v * maxV;
			}
		});
	}

	force.initialize = (_) => { nodes = _; };
	return force;
}

class Simulation {
	#cars = [];
	#extrema = [[0, 0], [0, 0]];
	#finalStanding = [];
	#laps = 10;
	#sectors = [];
	#simulation = d3.forceSimulation();
	#rails = [];
	#tick = 0;
	#time = 0;

	constructor({
		cars = [],
		extrema = [[0, 0], [0, 0]],
		laps = 10,
		rails = [],
		sectors = [],
		...options
	} = {}) {
		if (Number.isInteger(options.laps) && options.laps > 0) this.#laps = options.laps;

		if (Array.isArray(cars) && cars.length > 0) {
			this.#cars = cars;
			this.#simulation.nodes(this.#cars);
		}

		if (Array.isArray(rails) && rails.length > 0) {
			this.#rails = rails;
		} else {
			throw new TypeError('rails must be an array of points');
		}

		if (Array.isArray(extrema) && extrema.length === 2 && extrema.every(e => Array.isArray(e) && e.length === 2)) {
			this.#extrema = extrema;
		} else {
			throw new TypeError('extrema must be an array of two [min, max] arrays');
		}

		if (Array.isArray(sectors) && sectors.length > 0) {
			this.#sectors = sectors;
			// Add track forces to simulation
			this.#sectors.forEach((grad, i) => {
				grad.force = (() => {
					let nodes = [];

					function force(alpha) {
						nodes.forEach((node) => {
							// Do not apply to Cars outside Sector
							if (node.sector !== i) return;

							// Apply force to move v towards g
							const speed = Math.hypot(node.vx, node.vy);
							const v = [node.vx / speed, node.vy / speed];
							const normalizedGradient = grad.gradient.map(d => d / Math.hypot(...grad.gradient));
							let acceleration = [
								normalizedGradient[x] - v[x],
								normalizedGradient[y] - v[y],
							];

							// If acceleration in same direction as velocity, zero it
							const angle = Math.acos((
								acceleration[x] * v[x] + acceleration[y] * v[y]
							) / Math.hypot(...acceleration));
							if (Number.isNaN(angle) || angle * 180 / Math.PI < Number.EPSILON) {
								acceleration = [0, 0];
							}

							// Scale acceleration by correctiveStrength
							const a = Math.hypot(...acceleration);
							if (a > 1) acceleration = acceleration.map(d => d / a * correctiveStrength);
							else if (a > 0) acceleration = acceleration.map(d => d * correctiveStrength);

							// Add gradient to acceleration to more strongly force movement in that direction
							acceleration = acceleration.map((d, i) => d + normalizedGradient[i] * gravity);

							// Apply alpha decay and add to velocity
							node.vx += acceleration[x] * alpha;
							node.vy += acceleration[y] * alpha;

							const nextPosition = [node.x + node.vx, node.y + node.vy];

							// Determine when the car moves off this sector and onto the next
							// If not vertical
							if (Number.isFinite(grad.m) && Number.isFinite(grad.b)
								&& grad.α !== 0 && grad.α !== Math.PI && grad.α !== 2 * Math.PI
							) {
								const y0 = grad.m * nextPosition[x] + grad.b;
								if (grad.α > 0 && grad.α < Math.PI && y0 <= nextPosition[y]) {
									node.nextPiece = true;
								}
								if (grad.α > Math.PI && y0 >= nextPosition[y]) {
									node.nextPiece = true;
								}
							} else {
								// Vertical, simply check x
								if (grad.α === 0 && grad.x < nextPosition[x]) {
									node.nextPiece = true;
								}
								if (grad.α === Math.PI && grad.x > nextPosition[x]) {
									node.nextPiece = true;
								}
							}

							// Determine if the car moved back a sector
							const lastPiece = sectors[node.sector - 1 < 0 ? sectors.length - 1 : node.sector - 1];

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
				this.#simulation.force(`sector${i}`, grad.force);
			});
		} else {
			throw new TypeError('sectors must be an array of TrackPieces');
		}

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
			car.posn = [];
			car.time = [];
		});
		this.#moveCars();
		this.#simulation.alphaDecay(0);
		this.#simulation.velocityDecay(0.01);

		this.#simulation.on('tick', () => {
			this.#onTick();
		});
	}

	#onTick() {
		this.#simulation.nodes(this.#simulation.nodes());
		this.#time += dt;
		this.#tick++;
		this.#moveCars();

		if (this.#tick % debugInterval === 0) {
			postMessage({
				type: 'debug',
				detail: this.#cars.map(car => ({
					color: car.color,
					color2: car.color2,
					r: car.r,
					strokeWidth: car.strokeWidth,
					x: car.x,
					y: car.y,
				})),
			});
		}

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
				const piece = car.sector;
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

				car.sector = (car.sector + 1) % this.#sectors.length;
				car.nextPiece = false;
			}

			if (car.previousPiece) {
				car.sector--;
				if (car.sector < 0) {
					car.sector = this.#sectors.length - 1;
				}
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
				console.error('Car', car.name, 'went off track at tick', this.#tick, 'position:', car.x, car.y);
				console.log('Extrema:', ...this.#extrema[x], ...this.#extrema[y]);
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
		return new Simulation(json);
	}
}

let raceTrack;
self.addEventListener('message', (event) => {
	switch (event.data.type) {
		case 'startRace':
			raceTrack = new Simulation(event.data);
			raceTrack.simulation.alpha(1);
			postMessage({
				type: 'raceStarted',
			});
			break;
		case 'pauseRace':
			raceTrack.simulation.stop();
			postMessage({
				type: 'racePaused',
				// TODO: Include current state
			});
			break;
		case 'resumeRace':
			raceTrack.simulation.restart();
			postMessage({
				type: 'raceResumed',
			});
			break;
	}
});
