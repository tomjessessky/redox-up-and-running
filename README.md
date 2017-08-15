# Sample Code from Up and Running with the Redox API in 15 Minutes Video  
This is the sample code used in [the demo video I made](https://www.youtube.com/watch?v=4_CURkT_fCo) for using the Redox API and the Redox Dev Tools. 

## [Click here to see the demo video](https://www.youtube.com/watch?v=4_CURkT_fCo)

**A Note About the Video**  
In the video I used a Digital Ocean droplet server running NodeJS. 
While this is fine for testing out the Redox API using Dev Tools and the sample messages provided, to start sending and 
receiving real data *you will absolutely need to use a HIPAA compliant hosting solution*. Digital Ocean droplet servers, 
as seen in the video, are not HIPAA compliant.  

## Installation
You will need a server to run the Destination code, but you can run this locally and get the code for your Source working. 

### Pre-Requisites
- [NodeJS](https://nodejs.org) and NPM installed

Clone this repository to your environment, and run the following command to install the npm packages required:
```
npm install
```

## Starting the App
To start the app, simply run
```
node index.js
```  
You may want to consider using the [Forever library](https://www.npmjs.com/package/forever) to keep the app running after you close your Terminal or SSH session. 
