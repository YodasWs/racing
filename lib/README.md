yodasws
=======

You need to set the basic Route properties for each Page:

```javascript
yodasws.page('home').setRoute({
	template: 'pages/home.html',
	route: '/',
});
```

The Page allows for chaining:

```javascript
yodasws.page('AboutUs').setRoute({
	template: 'pages/AboutUs/AboutUs.html',
	route: '/AboutUs/',
}).on('load', () => {
	console.log('Page loaded!');
});
```

Set a custom 404 page to load for any route you haven't set:

```javascript
yodasws.page('404').setRoute({
	template: 'pages/404.html',
	route: '404',
});
```
