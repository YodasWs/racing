export default {
	customSyntax: 'postcss-scss',
	extends: [
		'stylelint-config-recommended-scss',
	],
	ignoreDisables: true,
	ignoreFiles: ['docs/**', 'node_modules/**', 'src/**/*.min.css'],
	rules: {
		// @rules

		// @media rules
		'no-unknown-custom-media': true,

		// Selectors
		'no-descending-specificity': null,

		// Duplicate properties (with exceptions)
		'declaration-block-no-duplicate-properties': [
			true,
			{ ignoreProperties: ['display'] },
		],

		// Invalid properties
		'no-unknown-custom-properties': true,

		// Fonts
		'font-weight-notation': 'named-where-possible',

		// Invalid values
		'color-no-invalid-hex': true,
		'declaration-no-important': true,
		'function-linear-gradient-no-nonstandard-direction': true,
		'function-no-unknown': true,
		'no-unknown-animations': true,
		'unit-no-unknown': true,

		// Hex formatting
		'color-hex-length': 'long',
	},
};
