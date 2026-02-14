const gravity = 1 / 7;
const correctiveStrength = 1 / 50;
const x = 0;
const y = 1;
const z = 2;

export default function TrackPiece(options, index) {
	if (!Number.isInteger(index) || index < 0) {
		throw new TypeError('TrackPiece requires a nonnegative integer index');
	}
	Object.assign(this, {
		gradient: [1, 0],
		delta: [0, 0],
		width: 20,
		rail: [1/2, 1/2],
	}, options);
	this.sector = index;

	const hypot = Math.hypot(...this.gradient)
	let α = Math.acos(this.gradient[x] / hypot);
	if (this.gradient[y] < 0) {
		α = 2 * Math.PI - α;
	}
	this.α = α;
}
