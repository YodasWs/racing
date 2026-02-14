import RaceTrack from '../../js/RaceTrack.mjs';
import Car from '../../js/Car.mjs';

const SVG = 'http://www.w3.org/2000/svg';
const x = 0;
const y = 1;
const z = 2;
const strokeWidth = 1;

yodasws.page('pageRaceSimulator').setRoute({
	title: 'Race Simulator',
	template: 'pages/RaceSimulator/RaceSimulator.html',
	canonicalRoute: '/RaceSimulator/',
	route: '/RaceSimulator/?',
}).on('load', () => {
	const svg = document.querySelector('svg#scene');

	// TODO: Load raceTrack from JSON file
	let raceTrack = new RaceTrack(svg, [
		new Car('Alice, TX', {
			color: 'lightgreen',
			color2: 'orange',
			rgb: [0x90, 0xee, 0x90],
		}),
		new Car('Brooklyn, NY', {
			color: 'white',
			color2: 'black',
			r: 3,
			strokeWidth: 3,
			rgb: [0x44, 0x44, 0x44],
		}),
		new Car('Charlotte, NC', {
			color: '#249E57',
			color2: 'lightgrey',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0x24, 0x9E, 0x57],
		}),
		new Car('Dallas, TX', {
			color: 'red',
			color2: '#000191',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0, 0x01, 0x91],
		}),
		new Car('Edison, NJ', {
			color: 'white',
			color2: '#00375D',
			r: 3,
			strokeWidth: 3,
			rgb: [0x30, 0x67, 0x8D],
		}),
		new Car('Florence, TN', {
			color: '#1E3258',
			color2: '#BF1F2D',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xBF, 0x1F, 0x2D],
		}),
		new Car('Garland, TX', {
			color: '#E61234',
			color2: '#FDB920',
			r: 3,
			strokeWidth: 3,
			rgb: [0xFD, 0xB9, 0x20],
		}),
		new Car('Helena, AL', {
			color: 'white',
			color2: '#A49C44',
			r: 3,
			strokeWidth: 3,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Irene', {
			color: 'gold',
			color2: 'brown',
			r: 3,
			strokeWidth: 3,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Jackie', {
			color: 'tan',
			color2: 'olive',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Karen', {
			color: 'lightgreen',
			color2: 'lightblue',
			r: 3,
			strokeWidth: 3,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Lily', {
			color: 'lavender',
			color2: 'pink',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Minnie', {
			color: 'black',
			color2: 'red',
			r: 3,
			strokeWidth: 3,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Naomi', {
			color: 'lavender',
			color2: 'purple',
			r: 3.5,
			strokeWidth: 2,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Olivia', {
			color: 'olive',
			color2: 'olive',
			r: 3,
			strokeWidth: 3,
			rgb: [0xB4, 0x9C, 0x26],
		}),
		new Car('Penny', {
			color: 'goldenrod',
			color2: 'orange',
			r: 4,
			strokeWidth: 1,
			rgb: [0xB4, 0x9C, 0x26],
		}),
	].sort(() => 0 && Math.sign(Math.random() * 2 - 1)), Object.assign({}, json.cSuzuka, {
		laps: 2,
	}));

	raceTrack.simulation.stop();
	raceTrack.init();

	if (Array.isArray(cars)) {
		d3.select('svg #gCars').selectAll('circle')
			.data(cars).enter().append('circle').classed('car', true)
			.attr('fill', d => d.color).attr('stroke', d => d.color2)
			.attr('stroke-width', car => car.strokeWidth)
			.attr('r', car => car.r).attr('cx', d => d.x).attr('cy', d => d.y);
	}

	document.getElementById('btnStart').focus();
	document.getElementById('btnStart').addEventListener('click', (evt) => {
		evt.preventDefault();
		switch (evt.currentTarget.innerText) {
			case 'Start':
				console.log('Sam, start!');
				raceTrack.simulation.stop();
				raceTrack.init();
				raceTrack.simulation.alpha(1);
				setTimeout((e) => {
					raceTrack.simulation.restart();
					e.innerText = 'Pause';
					e.disabled = false;
					e.focus();
				}, 500, evt.currentTarget);
				evt.currentTarget.disabled = true;
				break;
			case 'Pause':
				raceTrack.simulation.stop();
				evt.currentTarget.innerText = 'Play';
				break;
			case 'Play':
				raceTrack.simulation.restart();
				evt.currentTarget.innerText = 'Pause';
				break;
		}
	});

	if (document.getElementById('btnTick') instanceof Element) {
		document.getElementById('btnTick').addEventListener('click', (evt) => {
			evt.preventDefault();
			raceTrack.simulation.tick();
			raceTrack.onTick();
		});
	}
});
