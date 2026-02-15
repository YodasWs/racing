export default class Car {
	constructor(name, options = {}) {
		Object.assign(this, {
			strokeWidth: 1,
			r: 4,
		}, options, {
			sector: 0,
			trackAhead: [],
			nextPiece: false,
			previousPiece: false,
			lapTimes: [],
			time: [],
			posn: [],
			name,
		});
		this.radius = this.r + this.strokeWidth / 2;
	}
};
