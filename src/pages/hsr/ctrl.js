const height = 500;
const width = 600;

const exits85 = [
	{
		mile: 8,
		name: 'NC 161, Kings Mountain',
		cars: 47.5e3,
	},
	{
		mile: 10,
		name: 'US 74, 29, Kings Mountain',
		cars: 49e3,
	},
	{
		mile: 13,
		name: 'Bessemer City',
		cars: 80e3,
	},
	{
		mile: 14,
		name: 'NC 274, W Gastonia',
	},
	{
		mile: 17,
		name: 'US 321, Gastonia',
	},
	{
		mile: 19,
		name: 'NC 7, E Gastonia',
	},
	{
		mile: 20,
		name: 'NC 279, New Hope Rd, Dallas',
	},
	{
		mile: 21,
		name: 'Cox Rd, Ranlo',
	},
	{
		mile: 22,
		name: 'Cramerton, Lowell',
		cars: 127e3,
	},
	{
		mile: 23,
		name: 'NC 7, Lowell, McAdenville',
	},
	{
		mile: 26,
		name: 'Mt Holly, Belmont',
	},
	{
		mile: 27,
		name: 'NC 273, Belmont, Mt Holly',
	},
	{
		mile: 29,
		name: 'Sam Wilson Rd',
	},
	{
		mile: 30,
		name: 'I-485, Pineville, Huntersville',
	},
	{
		mile: 32,
		name: 'Little Rock Rd, CLT Airport',
	},
	{
		mile: 33,
		name: 'Billy Graham Pkwy',
	},
	{
		mile: 34,
		name: 'NC 27, Freedom Dr, Tuckaseegee Rd',
	},
	{
		mile: 35,
		name: 'Glenwood Dr',
	},
	{
		mile: 36,
		name: 'NC 16, Brookshire Blvd',
	},
	{
		mile: 37,
		name: 'Beatties Ford Rd',
	},
	{
		mile: 38,
		name: 'I-77, US 21',
	},
	{
		mile: 39,
		name: 'Statesville Ave/Rd',
	},
	{
		mile: 40,
		name: 'Graham St',
	},
	{
		mile: 41,
		name: 'Sugar Creek Rd',
	},
	{
		mile: 42,
		name: 'To US 29, To NC 49',
	},
	{
		mile: 43,
		name: 'University City Blvd, Ikea Blvd',
	},
	{
		mile: 45,
		name: 'NC 24, W.T. Harris Blvd',
	},
	{
		mile: 46,
		name: 'Mallard Creek Church Rd',
	},
	{
		mile: 48,
		name: 'I-485, Pineville, Matthews',
	},
	{
		mile: 49,
		name: 'Speedway Blvd, Concord Mills Blvd',
	},
	{
		mile: 52,
		name: 'Poplar Tent Rd',
	},
	{
		mile: 54,
		name: 'George W Liles Pkwy, Kannapolis Pkwy',
	},
	{
		mile: 55,
		name: 'NC 73, Concord, Huntersville',
	},
	{
		mile: 58,
		name: 'US 29, Concord Blvd',
	},
	{
		mile: 60,
		name: 'Copperfield Blvd, Dale Earnhardt Blvd',
	},
	{
		mile: 63,
		name: 'Lane St',
	},
	{
		mile: 65,
		name: 'Old Beatty Ford Rd, China Grove',
	},
	{
		mile: 68,
		name: 'NC 152, China Grove, Rockwell',
	},
	{
		mile: 70,
		name: 'Webb Rd',
	},
	{
		mile: 71,
		name: 'Peeler Rd',
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
		.attr('cx', d => x(d.mile))
		.attr('cy', d => y(d.mile));

	// Add Cars
	let dCars = [];
	exits85.forEach(exit => {
		if (exit.cars > 0) {
			dCars = dCars.concat(Array.from({ length: exit.cars / 40e3 }, () => ({
				x: exit.mile,
				y: 0,
			})));
		}
	});

	const gCars = gZoom.append('g')
		.classed('cars', true);
	const ptCars = gCars
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
	svg.on('dragstart', e => {
		svg.classed('drag', true)
	});

	// Add to Page
	document.querySelector('main').append(svg.node());

	// Run cars along path of exits
	const sim = d3.forceSimulation(dCars).alphaDecay(0).velocityDecay(1 - Math.pow(0.1, 2));
	sim.force('forceX', d3.forceX(exitRange[1]));
	sim.force('lineUp', forceLineUp(1 / 5));
	sim.on('tick', () => {
		// TODO: Check to add cars at interchanges
		// TODO: Check each car to exit
		// dCars.forEach((c, i) => {
		// });
		sim.stop();
		// Update car positions
		ptCars.attr('cx', d => x(d.x))
			.attr('cy', d => y(d.x));
	});
	sim.restart();
});

// Force the car behind to match front car's velocity without changing anything on the front car
const forceLineUp = (() => {
	function x(d) {
		return d.x + d.vx;
	}

	return function (radius) {
		let nodes,
			random;

		function force() {
			const n = nodes.length;
			for (let i = 0; i < n - 1; ++i) {
				const node = nodes[i];
				const next = nodes[i + 1];
				const distance = x(next) - x(node);
				if (distance < radius) {
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
