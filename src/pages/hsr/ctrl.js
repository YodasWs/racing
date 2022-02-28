const height = 500;
const width = 600;

const exits85 = [
	{
		mile: 8,
		name: 'NC 161, Kings Mountain',
		carsFromPriorExit: 47.5e3,
	},
	{
		mile: 10,
		name: 'US 74, 29, Kings Mountain',
		carsFromPriorExit: 49e3,
		carsExitHere: 1e3,
	},
	{
		mile: 13,
		name: 'Bessemer City',
		carsFromPriorExit: 80e3,
	},
	{
		mile: 14,
		name: 'NC 274, W Gastonia',
		carsFromPriorExit: 85e3,
	},
	{
		mile: 17,
		name: 'US 321, Gastonia',
		carsFromPriorExit: 93.5e3,
	},
	{
		mile: 19,
		name: 'NC 7, E Gastonia',
		carsFromPriorExit: 113e3,
	},
	{
		mile: 20,
		name: 'NC 279, New Hope Rd, Dallas',
		carsFromPriorExit: 123e3,
	},
	{
		mile: 21,
		name: 'Cox Rd, Ranlo',
		carsFromPriorExit: 124e3,
	},
	{
		mile: 22,
		name: 'Cramerton, Lowell',
		carsFromPriorExit: 127e3,
	},
	{
		mile: 23,
		name: 'NC 7, Lowell, McAdenville',
		carsFromPriorExit: 137e3,
	},
	{
		mile: 26,
		name: 'Mt Holly, Belmont',
		carsFromPriorExit: 139e3,
	},
	{
		mile: 27,
		name: 'NC 273, Belmont, Mt Holly',
		carsFromPriorExit: 138e3,
	},
	{
		mile: 29,
		name: 'Sam Wilson Rd',
		carsFromPriorExit: 148e3,
	},
	{
		mile: 30,
		name: 'I-485, Pineville, Huntersville',
		carsFromPriorExit: 149e3,
	},
	{
		mile: 32,
		name: 'Little Rock Rd, CLT Airport',
		carsFromPriorExit: 116e3,
	},
	{
		mile: 33,
		name: 'Billy Graham Pkwy',
		carsFromPriorExit: 120e3,
	},
	{
		mile: 34,
		name: 'NC 27, Freedom Dr, Tuckaseegee Rd',
		carsFromPriorExit: 127e3,
	},
	{
		mile: 35,
		name: 'Glenwood Dr',
		carsFromPriorExit: 137e3,
	},
	{
		mile: 36,
		name: 'NC 16, Brookshire Blvd',
		carsFromPriorExit: 141e3,
	},
	{
		mile: 37,
		name: 'Beatties Ford Rd',
		carsFromPriorExit: 129e3,
	},
	{
		mile: 38,
		name: 'I-77, US 21',
		carsFromPriorExit: 131e3,
	},
	{
		mile: 39,
		name: 'Statesville Ave/Rd',
		carsFromPriorExit: 162e3,
	},
	{
		mile: 40,
		name: 'Graham St',
		carsFromPriorExit: 173e3,
	},
	{
		mile: 41,
		name: 'Sugar Creek Rd',
		carsFromPriorExit: 175e3,
	},
	{
		mile: 42,
		name: 'To US 29, To NC 49',
		carsFromPriorExit: 172e3,
	},
	{
		mile: 43,
		name: 'University City Blvd, Ikea Blvd',
		carsFromPriorExit: 156e3,
	},
	{
		mile: 45,
		name: 'NC 24, W.T. Harris Blvd',
		carsFromPriorExit: 144e3,
	},
	{
		mile: 46,
		name: 'Mallard Creek Church Rd',
		carsFromPriorExit: 152e3,
	},
	{
		mile: 48,
		name: 'I-485, Pineville, Matthews',
		carsFromPriorExit: 150e3,
	},
	{
		mile: 49,
		name: 'Speedway Blvd, Concord Mills Blvd',
		carsFromPriorExit: 160e3,
	},
	{
		mile: 52,
		name: 'Poplar Tent Rd',
		carsFromPriorExit: 142e3,
	},
	{
		mile: 54,
		name: 'George W Liles Pkwy, Kannapolis Pkwy',
		carsFromPriorExit: 128e3,
	},
	{
		mile: 55,
		name: 'NC 73, Concord, Huntersville',
		carsFromPriorExit: 115e3,
	},
	{
		mile: 58,
		name: 'US 29, Concord Blvd',
		carsFromPriorExit: 108e3,
	},
	{
		mile: 60,
		name: 'Copperfield Blvd, Dale Earnhardt Blvd',
		carsFromPriorExit: 87.5e3,
	},
	{
		mile: 63,
		name: 'Lane St',
		carsFromPriorExit: 86e3,
	},
	{
		mile: 65,
		name: 'Old Beatty Ford Rd, Landis',
		carsFromPriorExit: 80e3,
	},
	{
		mile: 68,
		name: 'NC 152, China Grove, Rockwell',
		carsFromPriorExit: 80e3,
	},
	{
		mile: 70,
		name: 'Webb Rd',
		carsFromPriorExit: 89e3,
	},
	{
		mile: 71,
		name: 'Peeler Rd',
		carsFromPriorExit: 93e3,
	},
];

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
	let dCars = [];
	exits85.forEach(exit => {
		if (exit.carsFromPriorExit > 0) {
			dCars = dCars.concat(Array.from({ length: exit.carsFromPriorExit / 40e3 }, () => ({
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

	// Run cars along path of exits
	const sim = d3.forceSimulation(dCars).alphaDecay(0).velocityDecay(0);
	sim.force('forceX', d3.forceX(exitRange[1] + 15).strength(1e-6));
	sim.force('lineUp', forceLineUp(1 / 5));
	sim.on('tick', () => {
		// Remove cars at end of highway
		while (dCars.length > 0 && dCars[dCars.length - 1].x >= exitRange[1]) {
			console.log('Sam, vx:', dCars.pop().vx);
		}
		console.log('Sam, cars:', dCars.length);

		// TODO: Check to add cars at interchanges

		// TODO: Check each car to exit
		const carsToRemove = [];
		dCars = dCars.filter(car => {
			// Remove some cars at exit 38
			return !(car.x < 38 && car.x + car.vx >= 38 && Math.random() < 0.25);
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
