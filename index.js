var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var path = require('path');
var _ = require('lodash');

var DESTINATION_VERIFICATION_TOKEN = process.env.DESTINATION_VERIFICATION_TOKEN;
var SOURCE_API_KEY = process.env.SOURCE_API_KEY;
var SOURCE_SECRET = process.env.SOURCE_SECRET;
var authToken, authTokenExpires;

var lowdb = require('lowdb');
var db = lowdb('db.json');

db.defaults({ 
	appointments: [{
		"Meta": {
			"DataModel": "Scheduling",
			"EventType": "New",
			"EventDateTime": "2018-01-09T05:35:18.024Z",
			"Test": true,
			"Destinations": [
				{
					"ID": "af394f14-b34a-464f-8d24-895f370af4c9",
					"Name": "Redox EMR"
				}
			],
			"FacilityCode": null
		},
		"Patient": {
			"Identifiers": [
				{
					"ID": "0000000002",
					"IDType": "MR"
				},
				{
					"ID": "81ac9647-3a07-46b7-85b4-c5d09099fb3b",
					"IDType": "EHRID"
				},
				{
					"ID": "ffc486eff2b04b8^^^&1.3.6.1.4.1.21367.2005.13.20.1000&ISO",
					"IDType": "NIST"
				}
			],
			"Demographics": {
				"FirstName": "Barbara",
				"MiddleName": null,
				"LastName": "Bixby",
				"DOB": "1982-07-24",
				"SSN": "202-02-0002",
				"Sex": "Female",
				"Race": "White",
				"IsHispanic": null,
				"MaritalStatus": "Married",
				"IsDeceased": null,
				"DeathDateTime": null,
				"PhoneNumber": {
					"Home": "+18088675303",
					"Office": "+17077543758",
					"Mobile": "+19189368865"
				},
				"EmailAddresses": [
					"barb.bixby@test.net"
				],
				"Language": "en",
				"Citizenship": [],
				"Address": {
					"StreetAddress": "4762 Hickory Street",
					"City": "Monroe",
					"State": "WI",
					"ZIP": "53566",
					"County": "Green",
					"Country": "US"
				}
			},
			"Notes": []
		},
		"AppointmentInfo": [
			{
				"Code": "23457",
				"Codeset": "Redox EHR Codes",
				"Description": "Priority",
				"Value": "Normal"
			},
			{
				"Code": "23457",
				"Codeset": "Redox EHR Codes",
				"Description": "Form",
				"Value": "Lumbar"
			}
		],
		"Visit": {
			"VisitNumber": "1234",
			"AccountNumber": null,
			"VisitDateTime": "2018-01-10T03:40:16.525Z",
			"PatientClass": "Outpatient",
			"Status": null,
			"Duration": 15,
			"Reason": "Check up",
			"Instructions": [],
			"AttendingProvider": {
				"ID": "4236464757",
				"IDType": "NPI",
				"FirstName": "John",
				"LastName": "Slate",
				"Credentials": [
					"DO"
				],
				"Address": {
					"StreetAddress": "500 First St.",
					"City": "Clayton",
					"State": "MO",
					"ZIP": "63105",
					"County": "Saint Louis",
					"Country": "USA"
				},
				"Location": {
					"Type": null,
					"Facility": null,
					"Department": null,
					"Room": null
				},
				"PhoneNumber": {
					"Office": "+13145554321"
				}
			},
			"ConsultingProvider": {
				"ID": null,
				"IDType": null,
				"FirstName": null,
				"LastName": null,
				"Credentials": [],
				"Address": {
					"StreetAddress": null,
					"City": null,
					"State": null,
					"ZIP": null,
					"County": null,
					"Country": null
				},
				"Location": {
					"Type": null,
					"Facility": null,
					"Department": null,
					"Room": null
				},
				"PhoneNumber": {
					"Office": null
				}
			},
			"ReferringProvider": {
				"ID": "4356789876",
				"IDType": "NPI",
				"FirstName": "Pat",
				"LastName": "Granite",
				"Credentials": [
					"MD"
				],
				"Address": {
					"StreetAddress": "123 Main St.",
					"City": "Madison",
					"State": "WI",
					"ZIP": "53703",
					"County": "Dane",
					"Country": "USA"
				},
				"Location": {
					"Type": null,
					"Facility": null,
					"Department": null,
					"Room": null
				},
				"PhoneNumber": {
					"Office": "+16085551234"
				}
			},
			"VisitProvider": {
				"ID": null,
				"IDType": null,
				"FirstName": null,
				"LastName": null,
				"Credentials": [],
				"Address": {
					"StreetAddress": null,
					"City": null,
					"State": null,
					"ZIP": null,
					"County": null,
					"Country": null
				},
				"Location": {
					"Type": null,
					"Facility": null,
					"Department": null,
					"Room": null
				},
				"PhoneNumber": {
					"Office": null
				}
			},
			"Location": {
				"Type": "Inpatient",
				"Facility": "RES General Hospital",
				"Department": "3S",
				"Room": "136"
			},
			"Diagnoses": [
				{
					"Code": "N39.0",
					"Codeset": "ICD-10",
					"Name": "Urinary tract infection, site not specified",
					"Type": null
				},
				{
					"Code": "L20.84",
					"Codeset": "ICD-10",
					"Name": "Intrinsic (allergic) eczema",
					"Type": null
				}
			]
		}
	}]
}).write();

db._.mixin({ last: (array) => array[array.length - 1] });

app.use(bodyParser.json());

app.listen(process.env.PORT || 3000, function () {
	console.log('Server started. Listening on port 3000.');
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, './index.html'));
});

app.get('/api/scheduling', (req, res) => {
	const appointments = db.get('appointments').last().value();
	res.send(appointments);
});

app.post('/api/visitupdate', (req, res) => {

	const Patient = _.get(req, 'body.Patient');
	const Visit = _.get(req, 'body.Visit');
	Visit['PatientClass'] = Visit['PatientClass'] || 'Outpatient';  //lol

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
					DataModel: "PatientAdmin",
					EventType: "VisitUpdate",
					EventDateTime: new Date().toISOString(),
					Test: true,
				},
				Patient,
				Visit
			}
		};

		request.post(options, function (err, response, body) {
			if (err) {
				console.log(err);
				res.status(500).send(err);
			}

			console.log(response.statusCode);
			console.log(body.Meta.DataModel + " was received");
			res.send('neat');
		});
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

app.post('/api', function (req, res) {

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