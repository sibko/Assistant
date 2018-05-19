const fs = require('fs')
const http = require('http');
const querystring = require('querystring');
const q = require("q");



var config = fs.readFileSync('/home/pi/Assistant/config.json', 'utf8')
config = JSON.parse(config)

var hosts = config.ir.hosts
var devices = config.ir.devices
console.log(Object.keys(devices))
var sendRequest = function (device, action) {
    var _d = q.defer();

    const postData = querystring.stringify({ 'simple': 1, 'plain': device[action]});
    console.log("ADAM ", hosts[device.host])
	const options = {
		hostname: hosts[device.host],
		port: 80,
		path: '/json',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(postData)
		}
	};

	const req = http.request(options, (res) => {
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			console.log(`BODY: ${chunk}`);
		});
		res.on('end', () => {
            console.log('No more data in response.');
            _d.resolve();
		});
	});

	req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        _d.reject(e);
	});

	// write data to request body
	req.write(postData);
	req.end();
    return _d.promise
}

var processActions = function(device, actions) {
    var promises = [];
    actions.forEach(function (action) {
        if (action == 'sauce') {
            action = 'source'
        }
        console.log(device + action);
        if (action == 'off'){
            action='on'
        }
        if (!devices[device]) {
            console.log("DEVICE NOT FOUND", device)
            return
        }
        if (!devices[device][action]) {
            console.log("ACTION NOT FOUND")
            return
        }
        var promise = sendRequest(devices[device], action)
        promises.push(promise);
    })

    return q.all(promises);
}

var device = process.argv[2];
var actions = process.argv.slice(3);
console.log("Received ", device, actions)

var origAction = actions[0];
processActions(device,actions).then( function () {
    console.log(device, origAction)
    if ((device == 'color' || device == 'colorlight') && origAction == 'off'){
        sendRequest(devices[device], 'on')
        sendRequest(devices[device], 'flashoff')
    }
})



