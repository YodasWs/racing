'use strict';

(function(window) {
	// Define Global Object
	const yodasws = ensure(window, 'yodasws', () => {
		return new Proxy({}, superHandler([
			ComponentEventTarget,
		].map(parent => new parent(...arguments))));
	});

	let SITE_TITLE = '';
	let firstLoad = true;

	// Define Item Collections
	[
		'pages',
		'components',
	].forEach((key) => {
		Object.defineProperty(yodasws, key, {
			value: {},
		});
	});

	// Define Map Collections
	[
		'routes',
	].forEach((key) => {
		Object.defineProperty(yodasws, key, {
			value: new Map(),
		});
	});

	// Define Class Hierarchy
	const objects = {
		component: {
			parent: Component,
			collection: 'components',
			parents: [
				ComponentEventTarget,
			],
		},
		page: {
			parent: Page,
			collection: 'pages',
			parents: [
				Component,
				ComponentEventTarget,
			],
		},
	};

	// Component Class Definition
	function Component(componentName, element = undefined) {
		Object.defineProperties(this, {
			element: {
				enumerable: true,
				value: element,
			},
		});
		if (element instanceof Element) {
			element.setAttribute('y-component', componentName);
		}
		return Object.assign(this, {
			name: componentName,
		});
	}
	Object.defineProperties(Component.prototype, {
		adapter: {
			enumerable: true,
			value() {
				return this;
			},
		},
		init: {
			enumerable: true,
			value() {
				return this;
			},
		},
	});

	// Page Class Definition
	function Page(pageName, {
		title = null,
	} = {}) {
		Object.assign(this, {
			title,
		});
		return this;
	}
	Object.defineProperties(Page.prototype, {
		setRoute: {
			enumerable: true,
			value(obj) {
				ensure(yodasws.routes, obj.route, () => new Route(Object.assign(obj, {
					page: this,
				})));
				return this;
			},
		},
	});

	// Route Class Definition
	function Route(obj) {
		return Object.assign(this, obj, {
		});
	}

	let eventCount = 0;
	// Non-DOM Event Target
	function ComponentEventTarget() {
		const eventTarget = new EventTarget();
		const events = {};
		Object.defineProperties(this, {
			on: {
				enumerable: true,
				value(evts, cb) {
					evts.split(' ').forEach((evt) => {
						let [type, name] = evt.split('.');
						if (!name) {
							name = `evt${eventCount++}`;
						}
						events[type] = events[type] || {};
						events[type][name] = events[type][name] || [];
						cb = cb.bind(this);
						events[type][name].push(cb);
						eventTarget.addEventListener(type, cb);
					});
					return this;
				},
			},
			off: {
				enumerable: true,
				value(evt) {
					let [type, name] = evt.split('.');
					if (typeof events[type] !== 'object' || Object.values(events[type]).length === 0) {
						return this;
					}
					(name === undefined ? [].concat(...Object.values(events[type])) : events[type][name] || []).forEach((cb) => {
						eventTarget.removeEventListener(type, cb);
					});
					return this;
				},
			},
			fire: {
				enumerable: true,
				value(type, detail = undefined) {
					eventTarget.dispatchEvent(new CustomEvent(type, {
						detail,
					}));
					return this;
				},
			},
		});
		return this;
	}

	function superHandler(parents) {
		return {
			get: (target, key) => {
				const parent = parents.find(parent => Reflect.has(parent, key));
				if (parent !== undefined) {
					return Reflect.get(parent, key);
				}
				return Reflect.get(target, key);
			},
			has: (target, key) => {
				return Reflect.has(target, key) || parents.find(parent => Reflect.has(parent, key)) !== undefined;
			},
		};
	}

	// Build Class Hierarchy
	Object.entries(objects).forEach(([key, obj]) => {
		ensure(yodasws, key, () => (...args) => new (function () {
			return ensure(yodasws[obj.collection], args[0], () => new Proxy(
				new obj.parent(...arguments),
				superHandler(obj.parents.map(parent => new parent(...arguments))),
			));
		})(...args));
	});

	// <main> Element
	let main;
	let spinner;

	// Load First Route
	window.onload = () => {
		SITE_TITLE = document.title;
		if (!window.location.hash) {
			history.replaceState({}, null, '#!/');
		}
		main = document.querySelector('main');
		spinner = document.getElementById('y-spinner');
		spinner.remove();
		window.onpopstate();
	};

	document.addEventListener('DOMContentLoaded', () => {
		if (document.querySelector('body > nav') instanceof Element) {
			yodasws.component('topNav', document.querySelector('body > nav'));
		}
	});

	// Load Route Template
	function loadRoute(route) {
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				// Page Loaded
				if (Math.floor(xhr.status / 100) === 2) {
					if (typeof route.canonicalRoute === 'string' && route.canonicalRoute !== '') {
						history.replaceState({}, null, `#!${route.canonicalRoute}`);
					} else if (typeof route.canonicalRoute === 'function') {
						const rte = route.canonicalRoute(route);
						if (typeof rte === 'string' && rte !== '') {
							history.replaceState({}, null, `#!${rte}`);
						}
					}
					// Display Page
					main.innerHTML = xhr.response;
					if (route.title || route.page.title) {
						document.title = `${route.title || route.page.title} | ${SITE_TITLE}`;
					} else {
						document.title = SITE_TITLE;
					}
					showMain();
					main.setAttribute('y-page', route.page.name);
					Object.defineProperty(route.page, 'element', {
						configurable: true,
						enumerable: true,
						value: main,
					});
					route.page.fire('load');
					const scrollTop = {
						behavior: 'auto',
						top: 0,
					};
					main.scrollTo(scrollTop);
					window.scrollTo(scrollTop);
					yodasws.fire('page-loaded', {
						page: route.page.name,
					});
					if (firstLoad) {
						yodasws.fire('site-loaded');
						firstLoad = false;
					}
				} else switch (xhr.status) {
					case 404:
						if (route.route !== '404' && yodasws.routes.has('404')) {
							loadRoute(yodasws.routes.get('404'));
						} else {
							main.innerHTML = '<p>Page not found</p>';
							document.title = SITE_TITLE;
							showMain();
						}
						break;
					default:
						main.innerHTML = '<p>Error</p>';
						document.title = SITE_TITLE;
						showMain();
				}
			}
		};

		// Unload old page
		const oldPage = main.getAttribute('y-page');
		yodasws.page(oldPage).fire('unload');
		delete yodasws.page(oldPage).element;
		main.style.display = 'none';
		main.style.opacity = 0;
		// Show spinner
		main.insertAdjacentElement('afterend', spinner);

		xhr.open('GET', route.template);

		xhr.send();
	}

	// Remove the spinner and stop hiding <main>
	function showMain() {
		spinner.remove();
		main.style.removeProperty('display');
		main.style.removeProperty('opacity');
	}

	// Route Handling
	window.onpopstate = () => {
		const url = window.location.hash.replace('#!', '');
		for (const pageRoute of yodasws.routes.values()) {
			const regex = (() => {
				if (typeof pageRoute.route === 'string') {
					return new RegExp(`^${pageRoute.route}$`);
				}
				if (pageRoute.route instanceof RegExp) return pageRoute.route;
				return false;
			})();
			if (!(regex instanceof RegExp) || !regex.test(url) || !pageRoute.template) continue;

			// Simple String Replace and Go
			if (typeof pageRoute.template === 'string') {
				loadRoute({
					...pageRoute,
					template: window.location.hash.replace('#!', '').replace(regex, pageRoute.template),
				});
				return;
			}

			const routeObject = {
				...pageRoute,
			};

			let routeTemplate;
			// Template given as a function, takes results of String.match and returns a string or an object with at least key 'template'
			if (typeof pageRoute.template === 'function') {
				routeTemplate = pageRoute.template(...window.location.hash.replace('#!', '').match(regex));
			} else {
				routeTemplate = window.location.hash.replace('#!', '').replace(regex, pageRoute.template);
			}
			if (typeof routeTemplate === 'string') {
				routeObject.template = routeTemplate;
			} else if (typeof routeTemplate === 'object') {
				Object.assign(routeObject, routeTemplate);
			}
			loadRoute(routeObject);
			return;
		}
		loadRoute(yodasws.routes.get('404'));
	};

	// Declare 404 Page Not Found page
	yodasws.page('404').setRoute({
		template: 'pages/404.html',
		route: '404',
	});

	// Declare each property/method only once
	function ensure(obj, name, factory) {
		if (obj instanceof Map) {
			return obj.get(name) || (obj.set(name, factory()) && obj.get(name));
		}
		return obj[name] || (obj[name] = factory());
	}

})(window);
