importScripts('/res/d3.min.js');

const gravity = 1 / 7;
const correctiveStrength = 1 / 50;
const x = 0;
const y = 1;
const z = 2;

function forceRailingBounce(rails) {
	let nodes = [];
	function force(alpha) {
		nodes.forEach((car) => {
			const cp = closestPoint(rails[car.sector], car);
			// Bounce!
			// If car overlaping railing or car will run through railing
			// TODO: Need to construct force similar to d3.forceCollide to prevent bouncing off virtual/invisible railings
			if (cp.distance <= car.radius || cp.distance <= Math.hypot(car.vx / 2, car.vy / 2)) {
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

				// Finally, apply change in velocity
				car.vx -= delta[x];
				car.vy -= delta[y];
			}
		});

		return;

		// TODO: Rearrange so that each car only checks railing of current sector, not every sector
		rails.forEach((rail) => {
			nodes.forEach((car) => {
				const cp = closestPoint(rail, car);
				// Bounce!
				// If car overlaping railing or car will run through railing
				// TODO: Need to construct force similar to d3.forceCollide to prevent bouncing off virtual/invisible railings
				if (cp.distance <= car.radius || cp.distance <= Math.hypot(car.vx / 2, car.vy / 2)) {
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

					// Finally, apply change in velocity
					car.vx -= delta[x];
					car.vy -= delta[y];
				}
			});
		});
	}

	force.initialize = (_) => {
		nodes = _;
	};

	return force;
}

// TODO: pathNode is now an Array of sectors, so first find the rail for the current sector, or maybe the next sector
function closestPoint(rails, car) {
	let best;
	let bestLength;
	let bestDistance = Number.POSITIVE_INFINITY;
	let after;

	console.log('Sam, rails:', rails);
	console.log('Sam, car:', car);

	return {
		distance: bestDistance,
		after,
		best,
	};

	/*
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
	//*/
}

class Simulation {
	#cars = [];
	#debugInterval = 1;
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

		this.#simulation.force('fCollide', d3.forceCollide(car => car.radius));
		this.#simulation.force('fRailing', forceRailingBounce(this.#rails));

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

		// Place Cars on Starting Line
		this.#simulation.nodes().forEach((car, i) => {
			car.lapTimes = [];
			car.x = -7 * (i + 1);
			car.y = 5 * Math.pow(-1, i);
			// Start with some velocity to increase excitement at the start
			car.vx = 0.9;
			car.vy = 0;
			car.posn = [];
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
		requestAnimationFrame((time) => {
			this.#time = time;
		});
		this.#tick++;
		this.#moveCars();

		if (this.#tick % this.#debugInterval === 0) {
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
