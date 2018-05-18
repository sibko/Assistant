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

sendir = function (id, action) {
	exec("python /home/pi/Assistant/sendir.py " + id + " " + action.replace(" ", "").toLowerCase(), function (err, stdout, stderr) {
		console.log(err, stdout, stderr)
	})
}

transmit433 = function (id, action) {
	exec("python /home/pi/Assistant/Transmit433.py " + id + action.toLowerCase(), function (err, stdout, stderr) {
		console.log(err, stdout, stderr)
	})
}

createTimer = function (id, action, minutes, type) {
	var date = new Date()
	var timestamp = (date.getTime() / 1000) + minutes * 60
	exec("/home/pi/Assistant/createTimer.sh " + id + " " + action.toLowerCase() + " " + Math.floor(timestamp) + " " + type.toLowerCase(), function (err, stdout, stderr) {
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

pcControl = function () {
	http.get({
		host: '192.168.0.202',
		path: '/5/on'
	}, function (response) {
		console.log("pc wake up sent", response)
	})
}
espControl = function (device, action) {
	const postData = querystring.stringify({ 'colour': action });

	const options = {
		hostname: device,
		port: 80,
		path: '/',
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
		});
	});

	req.on('error', (e) => {
		console.error(`problem with request: ${e.message}`);
	});

	// write data to request body
	req.write(postData);
	req.end();

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
	device.ids.forEach(function (id) {
		console.log(id, action)
		switch (device.type) {
			case "infrared":
				sendir(id, action);
				break;
			case "energenie":
			case "generic":
			case "x10":
				transmit433(id, action);
				break;
			case "rPI":
				piControl(id, action);
				break;
			case "Windows":
				pcControl();
				break;
			case "ESP":
				espControl(id, action);
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
	device.ids.forEach(function (id) {
		console.log("timer", id, action, timer)
		createTimer(id, action, timer, device.type);
	})
	res.send("Complete");
});

