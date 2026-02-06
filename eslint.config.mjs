import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		languageOptions: {
			sourceType: 'module',
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2022,
			},
		},
		rules: {

'strict': [
	2, 'global',
],
'indent': [
	2,
	'tab',
	{
		'SwitchCase': 1,
	},
],
'quotes': [
	2,
	'single',
	{
		'avoidEscape': true,
	},
],
'space-before-function-paren': 0,
'comma-dangle': 0,
'no-console': 0,
'no-undef': 0,
'no-tabs': 0,
'no-var': 2,
'semi': 0,

		},
	},
]);
