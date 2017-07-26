var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

var DESTINATION_VERIFICATION_TOKEN = 'abcd1234';
var SOURCE_API_KEY = '91d0aa87-1487-4539-bc62-16bedb0e9b99';
var SOURCE_SECRET = 'Ieqdw6Jf5khZSygXbWw48n8Qm0OMZak1jKqzsURrJ4xoTs7IoltmaPKe23sL5ZepONEyXr8F';
var authToken, authTokenExpires;

var lowdb = require('lowdb');
var db = lowdb('db.json');

db.defaults({ appointments: [] })
	.write();

app.use(bodyParser.json());

app.listen(80, function () {
	console.log('Server started. Listening on port 80.');
});

app.get('/', function (req, res) {
	res.send('Hello, World!');
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
	if (req.body.Meta.DataModel === 'Scheduling' && req.body.Meta.EventType === 'New') {
		console.log('Scheduling message received!');

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

		getClinicalSummary(appointment);
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

function getClinicalSummary(appointment) {
	getAuthToken(function (token) {
		var options = {
			url: 'https://api.redoxengine.com/query',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			},
			json: true
		};

		options.body = {
			"Meta": {
				"DataModel": "Clinical Summary",
				"EventType": "PatientQuery",
				"EventDateTime": "2017-07-26T04:46:01.868Z",
				"Test": true,
				"Destinations": [
					{
						"ID": "ef9e7448-7f65-4432-aa96-059647e9b357",
						"Name": "Patient Query Endpoint"
					}
				]
			},
			"Patient": {
				"Identifiers": appointment.PatientIdentifiers
			}
		};

		request.post(options, function (err, response, body) {
			console.log('ClinicalSummary:');
			console.log(err);
			console.log(response.statusCode);
			console.log(body);
		})
	});
}























