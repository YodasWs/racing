const height = 500;
const width = 600;
yodasws.page('pageHsr').setRoute({
	title: 'High Speed Rail',
	template: 'pages/hsr/hsr.html',
	canonicalRoute: '/hsr/',
	route: '/hsr/?',
}).on('load', () => {
	// Transform functions
	const x = d3.scaleLinear([0, 1], [-width / 2, width / 2]);
	const y = d3.scaleLinear([0, 1], [-height / 2, height / 2]);

	// Build SVG
	const svg = d3.create('svg')
		.attr('viewBox', [-width / 2, -height / 2, width, height])
		.attr('height', height)
		.attr('width', width);

	const gZoom = svg.append('g')

	// Plot Exits
	const gExits = gZoom.append('g')
		.classed('exits', true);
	const dExits = Array.from({ length: 100 }, (a, i) => [(i + 1) / 51, (100 - i) / 201]);
	const ptExits = gExits
		.selectAll('circle')
		.data(dExits)
		.join('circle')
		.attr('cx', d => x(d[0]))
		.attr('cy', d => y(d[1]));

	// Add Cars
	const dCars = Array.from({ length: 100 }, (a, i) => ({
		x: i / 100,
		y: 0.5,
	}));
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

	// TODO: Run cars along path of exits

	const sim = d3.forceSimulation(dCars).alphaDecay(0).velocityDecay(1 - Math.pow(0.1, 2));

	// TODO: Add force so the car behind matches front car's velocity without changing anything on the front car

	sim.force('forceX', d3.forceX(2));
	sim.force('lineUp', force(1 / 200));
	sim.on('tick', () => {
		ptCars.attr('cx', d => x(d.x))
			.attr('cy', d => y(d.y));
	});
	sim.restart();
});

const force = (() => {
	function constant(x) {
		return () => x;
	}

	function jiggle(random) {
		return (random() - 0.5) * 1e-6;
	}

	function x(d) {
		return d.x + d.vx;
	}

	function y(d) {
		return d.y + d.vy;
	}

	return function (radius) {
		let nodes,
			random;

		function force() {
			const n = nodes.length;
			let i,
				tree,
				node,
				next,
				xi,
				yi,
				ri,
				ri2;

			for (let i = 0; i < n - 1; ++i) {
				node = nodes[i];
				next = nodes[i + 1];
				const distance = x(next) - x(node);
				if (distance < radius) {
					node.vx = node.vx - Math.abs(node.vx - next.vx) / 2;
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
