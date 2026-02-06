/**
 * Sam Grundman's Super Awesome Gulp Web Development Toolset
 */
'use strict';

import fs from 'fs';
const packageJson = JSON.parse(fs.readFileSync('./package.json'));

function camelCase() {
	return (
		Array.isArray(arguments[0]) ? arguments[0] : Array.from(arguments).join('-')
	).split(/\s+|\/|-/).filter((e) => {
		return e !== '' && e !== null && e !== undefined
	}).map((n, i) => {
		if (i === 0) return n
		return n.charAt(0).toUpperCase() + n.slice(1)
	}).join('');
}

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
const argv = yargs(hideBin(process.argv))
	.usage("\n\x1b[1mUsage:\x1b[0m gulp \x1b[36m<command>\x1b[0m \x1b[34m[options]\x1b[0m")
	.command('*', 'Compile files, run the server, and watch for changes to files', {
		port: {
			describe: 'The server port to listen to',
			type: 'number',
			default: 3000,
			alias: 'p',
		},
	})
	.command('serve', 'Run server', {
		port: {
			describe: 'The server port to listen to',
			type: 'number',
			default: 3000,
			alias: 'p',
		},
	})
	.command('compile', 'Compile all files and output to docs folder')
	.command('generate:page', 'Generate a new page', {
		section: {
			describe: 'Section under which to add page',
			required: false,
			default: '',
			alias: 's',
		},
		name: {
			describe: 'Name for your new page',
			required: true,
			alias: 'n',
		},
	})
	.command('generate:section', 'Generate a new section', {
		name: {
			describe: 'Name for your new section',
			required: true,
			alias: 'n',
		},
	})
	.command('lint', 'Lint all JavaScript and Sass/SCSS files')
	.command('lint:js', 'Lint all JavaScript files')
	.command('lint:css', 'Lint all Sass/SCSS files')
	.command('test', 'Run tests', {
		files: {
			describe: 'Files or glob pattern of test files to run',
			type: 'string',
		},
	})
	.command('transfer-files', 'Transfer all static assets and resources to docs folder')
	.command('watch', 'Watch files for changes to recompile')
	.help('?')
	.epilog(' ©2017–2025 Samuel B Grundman')
	.argv;

import gulp from 'gulp';
import path from 'path';
import fileExists from 'file-exists';

import * as sass from 'sass';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const plugins = require('gulp-load-plugins')({
	rename: {
		'gulp-autoprefixer': 'prefixCSS',
		'gulp-run-command': 'cli',
		'gulp-eslint-new': 'lintES',
		'gulp-htmlmin': 'compileHTML',
		'gulp-babel': 'compileJS',
		'gulp-order': 'sort',
		'gulp-file': 'newFile',
		'gulp-sass': 'compileSass',
	},
	postRequireTransforms: {
		cli(gulpRunCommand) {
			return gulpRunCommand.default;
		},
		compileSass(gulpSass) {
			return gulpSass(sass);
		},
	},
});
plugins.replaceString = require('@yodasws/gulp-pattern-replace');
plugins.webpack = require('webpack-stream');
plugins.named = require('vinyl-named');
plugins['connect.reload'] = plugins.connect.reload;

import lintCss from '@yodasws/gulp-stylelint';
plugins.lintCss = lintCss;

// more options at https://github.com/postcss/autoprefixer#options
const browsers = [
	// browser strings detailed at https://github.com/ai/browserslist#queries
	'defaults',
];

const options = {
	compileJS: {
		comments: false,
		minified: true,
		babelrc: false,
		compact: true,
		presets: [
			[
				'@babel/preset-env',
				{
					targets: browsers,
				},
			],
		],
	},
	compileSass: {
		style: 'compressed',
		loadPaths: [
			'node_modules',
			'src/scss',
		],
	},
	stripCssComments: {
		preserve: false,
	},
	compileHTML: {
		collapseWhitespace: true,
		decodeEntities: true,
		keepClosingSlash: false,
		removeComments: true,
		removeRedundantAttributes: true,
		removeScriptTypeAttributes: true,
		removeStyleLinkTypeAttributes: true,
		useShortDoctype: true,
	},
	prefixCSS: {
		cascade: false,
		overrideBrowserslist: browsers,
	},
	dest: 'docs/',
	rmLines: {
		css: {
			filters: [
				/^\s*$/,
				/^\s*@import\b/,
			],
		},
		js: {
			filters: [
				/^[\'"]use strict[\'"];$/,
				/^\s*$/,
			],
		},
	},
	concat: {
		css: {
			path: 'min.css',
		},
		js: {
			path: 'min.js',
		},
	},

	connect: {
		root: 'docs',
		fallback: 'index.html',
		livereload: true,
		port: argv.port,
	},

	lintCss: {
		configFile: '.stylelint.config.mjs',
		failAfterError: true,
		fix: false,
	},
	sort: {
		css: [
			'scss/**/*.{sa,sc,c}ss',
			'main.scss',
			'components/**/*.{sa,sc,c}ss',
			'**/*.{sa,sc,c}ss',
		],
		js: [
			'js/**/*.js',
			'{components,pages}/**/*.js',
			'app.js',
		],
	},
	replaceString: {
		js: {
			pattern: /\/\* app\.json \*\//,
			replacement: () => {
				// Read app.json to build site!
				const site = require('./src/app.json');
				const requiredFiles = [];
				[
					{
						prop:'pages',
						pref:'page',
					},
					{
						prop:'components',
						pref:'comp',
					},
				].forEach((p) => {
					if (!site[p.prop]) site[p.prop] = [];
					site[p.prop].forEach((c) => {
						const module = c.module || camelCase(p.pref, c.path);
						['module', 'ctrl'].forEach((k) => {
							const file = path.join(p.prop, c, `${k}.js`);
							try {
								fs.accessSync(`./src/${file}`);
								requiredFiles.push(file);
							} catch (e) {}
						});
					});
				});
				[
					'json',
					'js',
				].forEach((prop) => {
					if (site[prop]) Object.keys(site[prop]).forEach((i) => {
						try {
							fs.accessSync(`./src/${site[prop][i]}.${prop}`);
							if (Number.isNaN(Number.parseInt(i, 10))) {
								requiredFiles[i] = `${site[prop][i]}.${prop}`;
							} else {
								requiredFiles.push(`${site[prop][i]}.${prop}`);
							}
						} catch (e) {}
					});
				});
				let requires = 'window.json = {};\n';
				Object.keys(requiredFiles).forEach((i) => {
					const reqPath = String(requiredFiles[i]).replace(/\\/g, '/');
					if (Number.isNaN(Number.parseInt(i, 10))) {
						requires += `import ${i} from '../src/${reqPath}'; json.${i} = ${i};\n`;
					} else {
						requires += `import '../src/${reqPath}';\n`;
					}
				});
				return requires;
			},
			options: {
				notReplaced: false,
			},
		},
	},
	webpack: {
		mode: 'production',
		output: {
			filename: '[name].js',
		},
		module: {
			rules: [
				{
					test: /\.mjs$/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env'],
						},
					},
				},
			],
		},
	},
	ssi: {
		root: 'src',
	},
};

function runTasks(task) {
	const fileType = task.fileType || 'static';
	let stream = gulp.src(task.src);

	// Run each task
	(task.tasks || []).forEach((subtask) => {
		let option = options[subtask] || {};
		if (option[fileType]) option = option[fileType];
		if (subtask === 'compileSass') {
			stream = stream.pipe(plugins[subtask].sync(option)).on('error', function (error) {
				if (typeof error.messageFormatted === 'string') {
					console.error('Error!', error.messageFormatted);
				} else {
					console.error('Error!');
					console.log(JSON.stringify(error, '  '));
				}
				this.emit('end');
			});
			return;
		}
		stream = stream.pipe(plugins[subtask](option)).on('error', function (error) {
			if (typeof error.messageFormatted === 'string') {
				console.error('Error!', error.messageFormatted);
			} else {
				console.error('Error!', error);
			}
			this.emit('end');
		});
		if (subtask === 'lintES') {
			// Linting requires special formatting
			stream = stream.pipe(plugins[subtask].format());
			stream = stream.pipe(plugins[subtask].failAfterError());
		}
	});

	// Output Files
	return stream.pipe(gulp.dest(task.dest || options.dest));
}

[
	{
		name: 'compile:sass',
		src: [
			'src/main.scss',
			'src/**/*.{sa,sc,c}ss',
			'!**/*.min.css',
			'!**/min.css',
		],
		tasks: [
			'lintCss',
			'sort',
			'concat',
			'compileSass',
			'stripCssComments',
			'rmLines',
			'prefixCSS',
		],
		fileType: 'css',
	},
	{
		name: 'build:js',
		src: [
			'src/app.js',
		],
		tasks: [
			'lintES',
			'replaceString',
		],
		dest: 'build/',
		fileType: 'js',
	},
	{
		name: 'webpack:js',
		src: [
			'build/app.js',
		],
		tasks: [
			'named',
			'webpack',
		],
		dest: 'bundle/',
		fileType: 'js',
	},
	{
		name: 'minify:js',
		src: [
			'bundle/app.js',
		],
		tasks: [
			'compileJS',
			'rmLines',
		],
		fileType: 'js',
	},
	{
		name: 'compile:html',
		src: [
			'./src/**/*.html',
			'!**/includes/**/*.html',
		],
		tasks: [
			'ssi',
			'compileHTML',
		],
		fileType: 'html',
	},
	{
		name: 'transfer:assets',
		src: [
			'./src/**/*.jp{,e}g',
			// './src/**/*.json',
			'./src/**/*.gif',
			'./src/**/*.png',
			'./src/**/*.ttf',
		],
	},
].forEach((task) => {
	gulp.task(task.name, () => {
		return runTasks(task);
	});
});

function lintSass() {
	return gulp.src([
		argv.files || 'src/**/*.{sass,scss,css}',
		'!src/**/*.min.css',
	]).pipe(plugins.lintCss(options.lintCss || {}));
}

export function lintTests() {
	return gulp.src([
		argv.files || '{src,test}/**/*{-,.}test.{js,mjs}',
		'!**/*.min.js',
		'!**/min.js',
	])
		.pipe(plugins.lintES(options.lintES || {}))
		.pipe(plugins.lintES.format());
};

function lintJs() {
	return gulp.src([
		'src/**/*.{js,mjs}',
		'!src/**/*{-,.}test.{js,mjs}',
		'!src/json/**/*.mjs',
		'!**/*.min.js',
		'!**/min.js',
	])
		.pipe(plugins.lintES(options.lintES || {}))
		.pipe(plugins.lintES.format());
};

export { lintJs as 'lint:js' };
export { lintSass as 'lint:css' };

gulp.task('lint', gulp.parallel(lintSass, lintJs));

gulp.task('transfer:fonts', () => gulp.src([
	'./node_modules/font-awesome/fonts/fontawesome-webfont.*',
])
	.pipe(gulp.dest(path.join(options.dest, 'fonts')))
);

gulp.task('transfer:res', () => gulp.src([
	'./lib/*.js',
])
	.pipe(gulp.dest(path.join(options.dest, 'res'))),
);

gulp.task('transfer-files', gulp.parallel(
	'transfer:assets',
	'transfer:fonts',
	'transfer:res',
));

gulp.task('test:js', gulp.series(
	plugins.cli([
		`node --test ${argv.files || ''}`,
	]),
));

gulp.task('test', gulp.parallel(
	'test:js',
));

gulp.task('bundle:js', gulp.series(
	'build:js',
	'webpack:js',
));

gulp.task('compile:js', gulp.series(
	'test:js',
	'bundle:js',
	'minify:js',
));

gulp.task('compile', gulp.parallel('compile:html', 'compile:js', 'compile:sass', 'transfer-files'));
gulp.task('reload', (done) => {
	gulp.src('docs/').pipe(plugins['connect.reload']());
	done();
});

gulp.task('watch', (done) => {
	gulp.watch('./src/**/*.{sa,sc,c}ss', {
		usePolling: true,
	}, gulp.series('compile:sass', 'reload'));
	gulp.watch('./lib/*.js', {
		usePolling: true,
	}, gulp.series('transfer:res', 'reload'));
	gulp.watch('./src/**/*.{js,mjs,json}', {
		usePolling: true,
	}, gulp.series(lintJs, 'compile:js', 'reload'));
	gulp.watch('./src/**/*.html', {
		usePolling: true,
	}, gulp.series('compile:html', 'reload'));
	done();
});

gulp.task('serve', (done) => {
	plugins.connect.server(options.connect);
	done();
});

gulp.task('generate:page', gulp.series(
	(done) => {
		argv.sectionCC = argv.section ? camelCase(argv.section) + '/' : '';
		argv.nameCC = camelCase(argv.name);
		argv.module = camelCase('page', argv.sectionCC, argv.nameCC);
		done();
	},
	gulp.parallel(
		() => {
			const str = `[y-page='${argv.module}'] {\n\t/* SCSS Goes Here */\n}\n`;
			return plugins.newFile(`${argv.nameCC}.scss`, str, { src: true })
				.pipe(gulp.dest(`./src/pages/${argv.sectionCC}${argv.nameCC}`));
		},
		() => {
			const str = `<h2>${argv.name}</h2>\n`;
			return plugins.newFile(`${argv.nameCC}.html`, str, { src: true })
				.pipe(gulp.dest(`./src/pages/${argv.sectionCC}${argv.nameCC}`));
		},
		() => {
			const str = `yodasws.page('${argv.module}').setRoute({
	title: '${argv.name}',
	template: 'pages/${argv.sectionCC}${argv.nameCC}/${argv.nameCC}.html',
	canonicalRoute: '/${argv.sectionCC}${argv.nameCC}/',
	route: '/${argv.sectionCC}${argv.nameCC}/?',
}).on('load', () => {
});\n`
			return plugins.newFile(`ctrl.js`, str, { src: true })
				.pipe(gulp.dest(`./src/pages/${argv.sectionCC}${argv.nameCC}`));
		},
		() => {
			// Add to app.json
			const site = require('./src/app.json');
			if (!site.pages) site.pages = [];
			site.pages.push(`${argv.sectionCC}${argv.nameCC}`);
			return plugins.newFile('app.json', JSON.stringify(site, null, '\t'), { src: true })
				.pipe(gulp.dest(`./src`));
		},
	),
	plugins.cli([
		`git status`,
	]),
));

gulp.task('generate:section', gulp.series(
	(done) => {
		argv.nameCC = camelCase(argv.name);
		argv.module = camelCase('page', argv.nameCC);
		done();
	},
	gulp.parallel(
		() => {
			const str = `[y-page='${argv.module}'] {\n\t/* SCSS Goes Here */\n}\n`;
			return plugins.newFile(`${argv.nameCC}.scss`, str, { src: true })
				.pipe(gulp.dest(`./src/pages/${argv.nameCC}`));
		},
		() => {
			const str = `<h2>${argv.name}</h2>\n`;
			return plugins.newFile('index.html', str, { src: true })
				.pipe(gulp.dest(`./src/pages/${argv.nameCC}`));
		},
		() => {
			const str = `yodasws.page('${argv.module}').setRoute({
	title: '${argv.name}',
	canonicalRoute: '/${argv.nameCC}/',
	template(match, ...p) {
		const path = p.join('/').replace(/\\/+/g, '/').replace(/^\\\/|\\\/$/g, '').split('/').filter(p => p != '');
		if (path.length === 0) {
			return 'pages/${argv.nameCC}/index.html';
		}
		return {
			canonicalRoute: '/${argv.nameCC}/' + path.join('/') + '/',
			template: 'pages/${argv.nameCC}/' + path.join('.') + '.html',
		};
	},
	route: '/${argv.nameCC}(/.*)*',
}).on('load', () => {
	console.log('Page loaded!');
});\n`
			return plugins.newFile(`ctrl.js`, str, { src: true })
				.pipe(gulp.dest(`./src/pages/${argv.nameCC}`));
		},
		() => {
			// Add to app.json
			const site = require('./src/app.json');
			if (!site.pages) site.pages = [];
			site.pages.push(`${argv.nameCC}`);
			return plugins.newFile('app.json', JSON.stringify(site, null, '\t'), { src: true })
				.pipe(gulp.dest(`./src`));
		},
	),
	plugins.cli([
		`git status`,
	]),
));

// TODO: Let's move all of this into a separate file.
// Here we only need to check that other file exists, run it, then maybe delete it
gulp.task('init', gulp.series(
	plugins.cli([
		`mkdir -pv ./src`,
		`mkdir -pv ./docs`,
		`mkdir -pv ./build`,
		`mkdir -pv ./bundle`,
		`mkdir -pv ./src/pages`,
		`mkdir -pv ./src/includes`,
		`mkdir -pv ./src/includes/header`,
	]),

	gulp.parallel(

		(done) => {
			if (fileExists.sync('src/index.html')) {
				done();
				return;
			}
			const str = `<!DOCTYPE html>
<html lang="en-US">
<head>
<!--#include file="includes/head-includes.html" -->
<title>${argv.name}</title>
</head>
<body>
<!--#include file="includes/header/header.html" -->
<main aria-live="polite"></main>
<div id="y-spinner">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120">
	<path d="M 0-40 A 40 40 0 1 1 0 40" />
	<path d="M 0-40 A 40 40 0 1 0 0 40" />
</svg>Loading&hellip;</div>
</body>
</html>\n`;
			return plugins.newFile(`index.html`, str, { src: true })
				.pipe(gulp.dest(`./src`));
		},

		(done) => {
			if (fileExists.sync('src/main.scss')) {
				done();
				return;
			}
			const str = `* { box-sizing: border-box; }\n
:root { font-family: 'Trebuchet MS', 'Open Sans', 'Helvetica Neue', sans-serif; }\n
html {\n\theight: 100%;\n\twidth: 100%;\n\tbackground: whitesmoke;\n}\n
body {\n\tmargin: 0 auto;\n\twidth: 100%;\n\tmax-width: 1200px;\n\tmin-height: 100%;\n\tbackground: white;\n\tborder: 0 none;\n
\t@media (min-width: 1201px) {\n\t\tborder: solid black;\n\t\tborder-width: 0 1px;\n\t}\n
\t> * {\n\t\tpadding: 5px calc(5px * 2.5);\n\t}\n}\n
h1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n\tmargin: 0;\n}\n
a:link,\na:visited {\n\tcolor: dodgerblue;\n}\n
#y-spinner {\n\tfont-size: 2rem;\n\ttext-align: center;\n
\tsvg {\n\t\tdisplay: block;\n\t\tmargin: 20vh auto 0;\n\t\tmax-width: 150px;\n\t}\n
\tsvg * {\n\t\tstroke-linejoin: round;\n\t\tstroke-linecap: round;\n\t}\n
\tpath {\n\t\tfill: none;\n\t\tstroke: black;\n\t\tstroke-width: 10px;\n\t\topacity: 0.5;\n
\t\t&:nth-of-type(odd) {\n\t\t\tanimation: 2s linear infinite rotate;\n\t\t\tstroke: red;\n\t\t}\n
\t\t&:nth-of-type(even) {\n\t\t\tanimation: 3s linear infinite reverse rotate;\n\t\t\tstroke: gold;\n\t\t}\n\t}\n
\t@keyframes rotate {\n\t\tfrom { transform: rotate(0deg); }\n\t\tto { transform: rotate(360deg); }\n\t}\n
\t~ nav[y-component="topNav"] {\n\t\tdisplay: none;\n\t}\n}\n`;
			return plugins.newFile(`main.scss`, str, { src: true })
				.pipe(gulp.dest(`./src`));
		},

		(done) => {
			if (fileExists.sync('src/app.js')) {
				done();
				return;
			}
			const str = `/* app.json */
yodasws.page('home').setRoute({
	template: 'pages/home.html',
	route: '/',
});\n`;
			return plugins.newFile('app.js', str, { src: true })
				.pipe(gulp.dest(`./src`));
		},

		(done) => {
			if (fileExists.sync('src/app.json')) {
				done();
				return;
			}
			const site = {
				name: packageJson.name,
				components:[
				],
				sections:[
				],
				pages:[
				],
			};
			return plugins.newFile('app.json', JSON.stringify(site, null, '\t'), { src: true })
				.pipe(gulp.dest(`./src`));
		},

		(done) => {
			if (fileExists.sync('src/includes/header/header.html')) {
				done();
				return;
			}
			const str = `<header>\n\t<h1>${argv.name}</h1>\n</header>\n<nav hidden>\n\t<a href="#!/">Home</a>\n</nav>\n`;
			return plugins.newFile(`header.html`, str, { src: true })
				.pipe(gulp.dest(`./src/includes/header`));
		},

		(done) => {
			if (fileExists.sync('src/includes/header/header.scss')) {
				done();
				return;
			}
			const str = `$header-color: black;\n$header-bg: lightgreen;\n$header-second-color: black;\n
body > header {\n\tcolor: $header-color;\n\tbackground: $header-bg;\n
\th1 {\n\t\tmargin: 0;\n\t}\n\n\th2 {\n\t\tcolor: $header-second-color;\n\t}\n}\n
body > nav:not([hidden]) {\n\tdisplay: flex;\n\tflex-flow: row wrap;\n\tjustify-content: space-between;
\talign-content: flex-start;\n\talign-items: flex-start;\n
\t> *:not([hidden]) {\n\t\tdisplay: block;\n\t}\n}\n`;
			return plugins.newFile(`header.scss`, str, { src: true })
				.pipe(gulp.dest(`./src/includes/header`));
		},

		(done) => {
			if (fileExists.sync('src/includes/head-includes.html')) {
				done();
				return;
			}
			const str = `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="min.css" />
<script src="res/yodasws.js"></script>
<script src="app.js"></script>\n`
			return plugins.newFile(`head-includes.html`, str, { src: true })
				.pipe(gulp.dest(`./src/includes`));
		},

		(done) => {
			if (fileExists.sync('src/pages/home.html')) {
				done();
				return;
			}
			const str = `<h2>Home</h2>\n`;
			return plugins.newFile(`home.html`, str, { src: true })
				.pipe(gulp.dest(`./src/pages`));
		},

		(done) => {
			if (fileExists.sync('src/pages/home.scss')) {
				done();
				return;
			}
			const str = `[y-page='home'] {\n\t/* SCSS Goes Here */\n}\n`;
			return plugins.newFile(`home.scss`, str, { src: true })
				.pipe(gulp.dest(`./src/pages`));
		},

	),

	plugins.cli([
		`git status`,
	]),
));

gulp.task('compile:scss', gulp.series('compile:sass'));
gulp.task('compile:css', gulp.series('compile:sass'));

gulp.task('default', gulp.series(
	'lint',
	'compile',
	gulp.parallel(
		'serve',
		'watch',
	),
));
