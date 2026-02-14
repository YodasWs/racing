export default class Car {
	#name;

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
		});
		this.#name = name;
	}

	get name() {
		return this.#name;
	}

	get radius() {
		return this.r + this.strokeWidth / 2;
	}
};
