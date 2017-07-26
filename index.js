var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

app.use(bodyParser.json());

app.listen(80, function () {
	console.log('Server started. Listening on port 80.');
});

app.get('/', function (req, res) {
	res.send('Hello, World!');
});




