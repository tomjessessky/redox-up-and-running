var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var _ = require('lodash');

var DESTINATION_VERIFICATION_TOKEN = 'REPLACE_THIS';
var SOURCE_API_KEY = 'REPLACE_THIS';
var SOURCE_SECRET = 'REPLACE_THIS';
var authToken, authTokenExpires;

var lowdb = require('lowdb');
var db = lowdb('db.json');

db.defaults({ appointments: [] }).write();

db._.mixin({ last: (array) => array[array.length - 1] });

app.use(bodyParser.json());

app.listen(3000, function () {
	console.log('Server started. Listening on port 3000.');
});

app.get('/', (req, res) => {
	res.sendFile('./index.html');
});

app.get('api/scheduling', (req, res) => {
	const appointments = db.get('appointments').last().value();
	res.send(appointments);
});

app.post('api/visitupdate', (req, res) => {

});

app.get('/destination', function (req, res) {
	if (req.headers['verification-token'] === DESTINATION_VERIFICATION_TOKEN) {
		console.log('verification-token matched!');
		return res.send(req.query.challenge);
	}

	console.log('verfication-token did not match :( ');
	res.sendStatus(400);
});

app.post('/destination', function (req, res) {
	if (_.get(req, 'body.Meta.DataModel') === 'PatientAdmin' && _.get(req, 'body.Meta.EventType') === 'Registration') {
		console.log('Patient Registration Received');

		var appointment = {
			PatientFirstName: req.body.Patient.Demographics.FirstName,
			PatientLastName: req.body.Patient.Demographics.LastName,
			PatientIdentifiers: req.body.Patient.Identifiers,
			VisitDateTime: req.body.Visit.VisitDateTime,
			VisitReason: req.body.Visit.Reason,
			ProviderFirstName: req.body.Visit.AttendingProvider.FirstName,
			ProviderLastName: req.body.Visit.AttendingProvider.LastName,
			ProviderID: req.body.Visit.AttendingProvider.ID
		};

		db.get('appointments')
			.push(appointment)
			.write();

	}

	res.sendStatus(200);
});

app.get('/appointments', function (req, res) {
	var appointments = db.get('appointments').value();
	res.send(appointments);
});


function getAuthToken(callback) {
	if (authToken && Date.now() < new Date(authTokenExpires).getTime()) {
		return callback(authToken);
	} else {
		//get new token

		var options = {
			url: 'https://api.redoxengine.com/auth/authenticate',
			method: 'POST',
			body: {
				apiKey: SOURCE_API_KEY,
				secret: SOURCE_SECRET
			}, 
			headers: {
				'Content-Type': 'application/json'
			},
			json: true
		};

		request.post(options, function (err, response, body) {
			console.log(body);

			authToken = body.accessToken;
			authTokenExpires = body.expires;

			callback(authToken);
		});
	}
}