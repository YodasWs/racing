const attributeLimits = {
	restitution: [0.5, 1.1], // Bounciness, Higher → sharper, more energetic bounces, Lower → softer, more “thuddy” bounces
	stability: [0.5, 1.0], // Mass-like resistance to deflection, Higher → more stable, Lower → more easily deflected
	glancing: [0.2, 1.0], // Glancing velocity is added, Higher → marble "glances" and keeps speed, Lower → marble loses speed on shallow hits
	drag: [0.0, 0.1], // Post-bounce speed loss, Makes some marbles feel "heavier" or "stickier"
	skill: [0.2, 0.3], // How much of a maximum speed boost is allowed to be gained on bouncing against the railing
	drafting: [0.0, 0.1], // How much speed is gained by drafting
};
Object.keys(attributeLimits).forEach((key) => {
	attributeLimits[key] = attributeLimits[key].sort();
});

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
		Object.entries(attributeLimits).forEach(([key, val]) => {
			if (this[key] === undefined) {
				this[key] = val[0] + (Math.random() - 0.5) * (val[1] - val[0]);
			}
		});
	}
};
