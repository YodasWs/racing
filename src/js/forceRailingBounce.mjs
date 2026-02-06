const x = 0;
const y = 1;
const z = 2;

export default function forceRailingBounce(rails) {
	let nodes = [];
	function force(alpha) {
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

function closestPoint(pathNode, point) {
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
}
