const express = require('express');

const app = express();
const fs = require('fs')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const sys = require('sys')
const exec = require('child_process').exec;
const http = require('http');
const querystring = require('querystring');
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.listen(1966, () => {
	console.log('Server started!');
});

var config = fs.readFileSync('/home/pi/Assistant/config.json', 'utf8')
config = JSON.parse(config)
var devices = config.devices
console.log("loaded devices:")
devices.forEach(function (device) {
	console.log(device.name)
})

createTimer = function (id, action, minutes, type) {
	var date = new Date()
	var timestamp = (date.getTime() / 1000) + minutes * 60
	exec("/home/pi/Assistant/createTimer.sh '" + id + "' '" + action + "' " + Math.floor(timestamp) + " " + type.toLowerCase(), function (err, stdout, stderr) {
		console.log(err, stdout, stderr)
	})
}

piControl = function (pi, action) {
	var command = ""
	if (action == 'Restart') {
		command = "echo sudo shutdown -r now | ssh pi@" + pi
	} else if (action == 'Off') {
		command = "echo sudo shutdown -h now | ssh pi@" + pi
	}
	exec(command, function (err, stdout, stderr) {
		console.log(err, stdout, stderr)
	})

}

doAction = function (name, action) {
	var command = 'node /home/pi/Assistant/DoAction.js "' + name + '" "' + action +'"'
	
	exec(command, function (err, stdout, stderr) {
		console.log(err, stdout, stderr)
	})

}

getdevice = function (requested) {
	var ret = ''
	devices.forEach(function (device) {
		if (device.name == requested) {
			return ret = device;
		}
	})
	if (ret == '') {
		throw 'device not found';
	} else {
		console.log(ret)
		return ret
	}
}

app.get('/', function (req, res) {
	res.sendfile('./public/index.html');
});

app.route('/api/devices/').get((req, res) => {
	res.send(devices);
});
app.route('/api/devices/:name').get((req, res) => {
	const requesteddevice = req.params['name'];
	res.send(getdevice(requesteddevice));
});
app.route('/api/device/:name/:action').get((req, res) => {
	const devicename = req.params['name'];
	const device = getdevice(devicename)
	const action = req.params['action'];
	if (device.functions.indexOf(action) < 0) {
		console.log("ACTION NOT FOUND")
		res.send("ACTION NOT FOUND");
	}
	device.ids.forEach(function (id) {
		console.log(id, action)
		switch (device.type) {
			case "infrared":
			case "energenie":
			case "generic":
			case "x10":
			case "twelvevolt":			
			case "ESP":
				doAction(device.name, action)
				break;
			case "rPI":
				piControl(id, action);
				break;
		}
	})
	res.send("Complete");
});

app.route('/api/device/:name/:action/:timer').get((req, res) => {
	const devicename = req.params['name'];
	const device = getdevice(devicename)
	const action = req.params['action'];
	const timer = req.params['timer'];
	console.log("timer", device.name, action, timer)
	createTimer(device.name, action, timer, device.type);
	res.send("Complete");
});

