const gravity = 1 / 8;
const correctiveStrength = 1 / 40;
const x = 0;
const y = 1;
const z = 2;

function TrackPiece(options) {
	Object.assign(this, {
		gradient: [1, 0],
		delta: [0, 0],
		width: 20,
		rail: [1/2, 1/2],
	}, options);

	const hypot = Math.hypot(...this.gradient)
	let α = Math.acos(this.gradient[x] / hypot);
	if (this.gradient[y] < 0) {
		α = 2 * Math.PI - α;
	}
	this.α = α;

	this.force = (() => {
		let nodes = [];
		const piece = this;

		function force(alpha) {
			nodes.forEach((node) => {
				// Do not apply to Cars outside piece
				if (node.trackAhead.length === 0) return;
				if (node.trackAhead[0] !== piece) return;

				// Apply force to move v towards g
				const speed = Math.hypot(node.vx, node.vy);
				const v = [node.vx / speed, node.vy / speed];
				const normalizedGradient = piece.gradient.map(d => d / Math.hypot(...piece.gradient));
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

				// Determine when the car moves off this piece and onto the next
				// If not vertical
				if (Number.isFinite(piece.m) && Number.isFinite(piece.b)
					&& piece.α !== 0 && piece.α !== Math.PI && piece.α !== 2 * Math.PI
				) {
					const y0 = piece.m * nextPosition[x] + piece.b;
					if (piece.α > 0 && piece.α < Math.PI && y0 <= nextPosition[y]) {
						node.nextPiece = true;
					}
					if (piece.α > Math.PI && y0 >= nextPosition[y]) {
						node.nextPiece = true;
					}
				} else {
					// Vertical, simply check x
					if (piece.α === 0 && piece.x < nextPosition[x]) {
						node.nextPiece = true;
					}
					if (piece.α === Math.PI && piece.x > nextPosition[x]) {
						node.nextPiece = true;
					}
				}

				// Determine if the car moved back a piece
				const lastPiece = node.trackAhead.slice(-1).pop();

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
}

module.exports = TrackPiece;
