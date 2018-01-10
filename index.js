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
	getAuthToken(toke => {
		var options = {
			url: 'https://api.redoxengine.com/query',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + toke
			},
			json: true,
			body: {
				Meta: {
					DataModel: "Clinical Summary",
					EventType: "PatientQuery",
					EventDateTime: "2017-07-26T04:46:01.868Z",
					Test: true,
					Destinations: [{
						ID: "ef9e7448-7f65-4432-aa96-059647e9b357",
						Name: "Patient Query Endpoint"
					}]
				},
				Patient: {
					Identifiers: appointment.PatientIdentifiers
				}
			}
		};

		request.post(options, function (err, response, body) {
			console.log('ClinicalSummary:');
			console.log(err);
			console.log(response.statusCode);
			console.log(body.Meta.DataModel + " was received");

			sendMedia(appointment);
		})
	});



});

app.get('/api', function (req, res) {
	if (req.headers['verification-token'] === DESTINATION_VERIFICATION_TOKEN) {
		console.log('verification-token matched!');
		return res.send(req.query.challenge);
	}

	console.log('verfication-token did not match :( ');
	res.sendStatus(400);
});

app.post('/api/scheduling', function (req, res) {

	if (req.headers['verification-token'] !== DESTINATION_VERIFICATION_TOKEN) {
		console.log('Bad verification token.');
		return res.sendStatus(403);
	}

	if (!_.get(req, 'body.Meta.DataModel') === 'Scheduling' ||
		!_.get(req, 'body.Meta.EventType') === 'New') {
		res.sendStatus(400);
	}

	console.log('Patient Registration Received');

	db.get('appointments')
		.push(_.get(req, 'body'))
		.write();

	const patientEmail = _.get(req, 'body.Patient.Demographics.EmailAddresses[0]');
	const patientPhone = _.get(req, 'body.Patient.Demographics.PhoneNumber.Mobile');
	console.log(`Texting patient at ${patientPhone} and emailing patient at ${patientEmail}`);

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