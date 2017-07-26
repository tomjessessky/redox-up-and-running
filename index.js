var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

var DESTINATION_VERIFICATION_TOKEN = 'abcd1234';

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
	}

	res.sendStatus(200);
});

app.get('/appointments', function (req, res) {
	var appointments = db.get('appointments').value();
	res.send(appointments);
});





