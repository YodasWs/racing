const height = 500;
const width = 600;

const exits85 = [
	{
		mile: 8,
		name: 'NC 161, Kings Mountain',
		carsNorthboundApproach: 47.5e3,
		carsNorthboundExitHere: 1.5e3,
		carsSouthboundExitHere: 2.5e3,
		carsNorthboundEnterHere: 2e3,
		carsSouthboundEnterHere: 1.6e3,
	},
	{
		mile: 10,
		name: 'US 74, 29, Kings Mountain',
		carsNorthboundApproach: 49e3,
		carsNorthboundExitHere: 0.1e3 + 0.95e3,
		carsSouthboundExitHere: 15e3 + 0.1e3,
		carsNorthboundEnterHere: 15e3 + 500,
		carsSouthboundEnterHere: 450 + 750,
	},
	{
		mile: 13,
		name: 'Bessemer City',
		carsNorthboundApproach: 80e3,
	},
	{
		mile: 14,
		name: 'NC 274, W Gastonia',
		carsNorthboundApproach: 85e3,
	},
	{
		mile: 17,
		name: 'US 321, Gastonia',
		carsNorthboundApproach: 93.5e3,
	},
	{
		mile: 19,
		name: 'NC 7, E Gastonia',
		carsNorthboundApproach: 113e3,
	},
	{
		mile: 20,
		name: 'NC 279, New Hope Rd, Dallas',
		carsNorthboundApproach: 123e3,
	},
	{
		mile: 21,
		name: 'Cox Rd, Ranlo',
		carsNorthboundApproach: 124e3,
	},
	{
		mile: 22,
		name: 'Cramerton, Lowell',
		carsNorthboundApproach: 127e3,
	},
	{
		mile: 23,
		name: 'NC 7, Lowell, McAdenville',
		carsNorthboundApproach: 137e3,
	},
	{
		mile: 26,
		name: 'Mt Holly, Belmont',
		carsNorthboundApproach: 139e3,
	},
	{
		mile: 27,
		name: 'NC 273, Belmont, Mt Holly',
		carsNorthboundApproach: 138e3,
	},
	{
		mile: 29,
		name: 'Sam Wilson Rd',
		carsNorthboundApproach: 148e3,
	},
	{
		mile: 30,
		name: 'I-485, Pineville, Huntersville',
		carsNorthboundApproach: 149e3,
	},
	{
		mile: 32,
		name: 'Little Rock Rd, CLT Airport',
		carsNorthboundApproach: 116e3,
	},
	{
		mile: 33,
		name: 'Billy Graham Pkwy',
		carsNorthboundApproach: 120e3,
	},
	{
		mile: 34,
		name: 'NC 27, Freedom Dr, Tuckaseegee Rd',
		carsNorthboundApproach: 127e3,
	},
	{
		mile: 35,
		name: 'Glenwood Dr',
		carsNorthboundApproach: 137e3,
	},
	{
		mile: 36,
		name: 'NC 16, Brookshire Blvd',
		carsNorthboundApproach: 141e3,
	},
	{
		mile: 37,
		name: 'Beatties Ford Rd',
		carsNorthboundApproach: 129e3,
	},
	{
		mile: 38,
		name: 'I-77, US 21',
		carsNorthboundApproach: 131e3,
		carsNorthboundExitHere: 2.2e3 + 7.4e3,
		carsSouthboundExitHere: 4.2e3 + 31.5e3,
		carsNorthboundEnterHere: 3e3 + 22.5e3,
		carsSouthboundEnterHere: 1.5e3 + 7.6e3,
	},
	{
		mile: 39,
		name: 'Statesville Ave/Rd',
		carsNorthboundApproach: 162e3,
	},
	{
		mile: 40,
		name: 'Graham St',
		carsNorthboundApproach: 173e3,
	},
	{
		mile: 41,
		name: 'Sugar Creek Rd',
		carsNorthboundApproach: 175e3,
	},
	{
		mile: 42,
		name: 'To US 29, To NC 49',
		carsNorthboundApproach: 172e3,
	},
	{
		mile: 43,
		name: 'University City Blvd, Ikea Blvd',
		carsNorthboundApproach: 156e3,
	},
	{
		mile: 45,
		name: 'NC 24, W.T. Harris Blvd',
		carsNorthboundApproach: 144e3,
	},
	{
		mile: 46,
		name: 'Mallard Creek Church Rd',
		carsNorthboundApproach: 152e3,
	},
	{
		mile: 48,
		name: 'I-485, Pineville, Matthews',
		carsNorthboundApproach: 150e3,
	},
	{
		mile: 49,
		name: 'Speedway Blvd, Concord Mills Blvd',
		carsNorthboundApproach: 160e3,
	},
	{
		mile: 52,
		name: 'Poplar Tent Rd',
		carsNorthboundApproach: 142e3,
	},
	{
		mile: 54,
		name: 'George W Liles Pkwy, Kannapolis Pkwy',
		carsNorthboundApproach: 128e3,
	},
	{
		mile: 55,
		name: 'NC 73, Concord, Huntersville',
		carsNorthboundApproach: 115e3,
	},
	{
		mile: 58,
		name: 'US 29, Concord Blvd',
		carsNorthboundApproach: 108e3,
	},
	{
		mile: 60,
		name: 'Copperfield Blvd, Dale Earnhardt Blvd',
		carsNorthboundApproach: 87.5e3,
	},
	{
		mile: 63,
		name: 'Lane St',
		carsNorthboundApproach: 86e3,
	},
	{
		mile: 65,
		name: 'Old Beatty Ford Rd, Landis',
		carsNorthboundApproach: 80e3,
	},
	{
		mile: 68,
		name: 'NC 152, China Grove, Rockwell',
		carsNorthboundApproach: 80e3,
	},
	{
		mile: 70,
		name: 'Webb Rd',
		carsNorthboundApproach: 89e3,
	},
	{
		mile: 71,
		name: 'Peeler Rd',
		carsNorthboundApproach: 93e3,
	},
].map((exit) => {
	exit.percentNorthboundExit = (exit.carsNorthboundExitHere || 0) / (exit.carsNorthboundApproach / 2);
	return exit;
});

yodasws.page('pageHsr').setRoute({
	title: 'High Speed Rail',
	template: 'pages/hsr/hsr.html',
	canonicalRoute: '/hsr/',
	route: '/hsr/?',
}).on('load', () => {
	// Transform functions
	const exitRange = d3.extent(exits85, d => d.mile);
	const x = d3.scaleLinear(exitRange, [-width / 2, width / 2]);
	const y = d3.scaleLinear(exitRange, [height / 2, -height / 2]);

	// Build SVG
	const svg = d3.create('svg')
		.attr('viewBox', [-width / 2, -height / 2, width, height])
		.attr('height', height)
		.attr('width', width);

	const gZoom = svg.append('g')

	// Plot Exits
	const gExits = gZoom.append('g')
		.classed('exits', true);
	const ptExits = gExits
		.selectAll('circle')
		.data(exits85, d => d.mile)
		.join('circle')
		.classed('e38', d => d.mile === 38)
		.attr('cx', d => x(d.mile))
		.attr('cy', d => y(d.mile));

	// Add Cars
	let dCars = Array.from({ length: exits85[0].carsNorthboundApproach / 1e3 }, () => ({
		x: 0,
		y: 0,
	}));
	exits85.forEach(exit => {
		if (exit.carsNorthboundEnterHere > 0) {
			dCars = dCars.concat(Array.from({ length: exit.carsNorthboundEnterHere / 1e3 }, () => ({
				x: exit.mile,
				y: 0,
			})));
		}
	});

	const gCars = gZoom.append('g')
		.classed('cars', true);
	let ptCars = gCars
		.selectAll('circle')
		.data(dCars)
		.join('circle');

	// Zoom Control
	const zoom = d3.zoom()
		.on('start', () => {
			svg.classed('zoom', true);
		})
		.on('end', () => {
			svg.classed('zoom', false);
		})
		.on('zoom', ({ transform }) => {
			gZoom.attr('transform', transform);
		});
	svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

	// Add to Page
	document.querySelector('main').append(svg.node());

	// For testing, use exit 38
	const exit38 = exits85.find(d => d.mile = 38);
	console.log('Sam, exit chance:', (exit38.percentNorthboundExit * 100).toFixed(2));

	// Run cars along path of exits
	const sim = d3.forceSimulation(dCars).alphaDecay(0).velocityDecay(0);
	sim.force('forceX', d3.forceX(exitRange[1] + 15).strength(1e-6));
	sim.force('lineUp', forceLineUp(1 / 5));
	sim.on('tick', () => {
		// Remove cars at end of highway
		while (dCars.length > 0 && dCars[dCars.length - 1].x >= exitRange[1]) {
			dCars.pop();
		}

		// TODO: Check to add cars at interchanges
		// carsNorthboundEnterHere

		// TODO: Check each car to exit
		const carsToRemove = [];
		dCars = dCars.filter(car => {
			// Remove some cars at exit 38
			return !(car.x < exit38.mile && car.x + car.vx >= exit38.mile && Math.random() < exit38.percentNorthboundExit);
		});

		// Update car positions
		ptCars = gCars
			.selectAll('circle')
			.data(dCars)
			.join('circle')
			.attr('cx', d => x(d.x))
			.attr('cy', d => y(d.x));
		if (dCars.length === 0) sim.stop();
	});
	sim.restart();
});

// Force the car behind to match front car's velocity without changing anything on the front car
const forceLineUp = (() => {
	const x = d => d.x + d.vx;
	return function (radius) {
		let nodes,
			random;

		function force() {
			const n = nodes.length;
			if (n <= 1) return;
			for (let i = 0; i < n - 1; ++i) {
				const node = nodes[i];
				const next = nodes[i + 1];
				if (x(next) - x(node) < radius) {
					node.vx -= Math.abs(node.vx - next.vx) / 2;
					node.x = Math.min(node.x, next.x - radius);
				}
			}
		}

		force.initialize = function(_nodes, _random) {
			nodes = _nodes;
			random = _random;
		};

		return force;
	}
})();
