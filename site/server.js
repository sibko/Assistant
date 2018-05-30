const express = require('express');
const log4js = require('log4js')
const app = express();
const fs = require('fs')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const exec = require('child_process').exec;
const http = require('http');
const querystring = require('querystring');
const q = require("q");
const dir = '/home/pi/'

log4js.configure({
	appenders: {
		cons: { type: 'console' },
		server: { type: 'file', filename: dir + 'logs/server.log' }
	},
	categories: {
		default: { appenders: ['cons', 'server'], level: 'debug' }
	}

});
var logger = log4js.getLogger()

app.use(morgan({"format": "default", "stream": { write: function(str) { logger.debug(str);}}}));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.listen(1966, () => {
	logger.info('Server started!');
});

var config = fs.readFileSync(dir + 'Assistant/config.json', 'utf8')
config = JSON.parse(config)
var devices = config.devices
logger.info("loaded devices:")
devices.forEach(function (device) {
	logger.info(device.name)
})

createTimer = function (id, action, minutes, type) {
	var date = new Date()
	var timestamp = (date.getTime() / 1000) + minutes * 60
	exec(dir + "Assistant/createTimer.sh '" + id + "' '" + action + "' " + Math.floor(timestamp) + " " + type.toLowerCase(), function (err, stdout, stderr) {
		logger.info("createTimer: ", err, stdout, stderr)
	})
}

linuxControl = function (device, action) {
	var command = ""
	if (action == 'Restart') {
		command = "echo sudo shutdown -r now | ssh " + device.user + "@" + device.ids[0]
	} else if (action == 'Off') {
		command = "echo sudo shutdown -h now | ssh " + device.user + "@" + device.ids[0]
	}
	exec(command, function (err, stdout, stderr) {
		logger.info("linux control: ", err, stdout, stderr)
	})

}

getLogs = function (device) {
	var d = q.defer()
	var command = 'echo "tail -n 500 ' + dir + 'assLogs.log | tac" | ssh -q ' + device.user + '@' + device.ids[0]
	exec(command, function (err, stdout, stderr) {
		logger.info("get logs: ", err, stdout, stderr)
		if (err) {
			d.resolve(err + stderr)
		} else {
			d.resolve(stdout)
		}
	})
	return d.promise
}

pingDevice = function (device) {
	var d = q.defer()
	var command = 'ping -c 2 ' + device.ids[0]
	exec(command, function (err, stdout, stderr) {
		logger.info("ping device: ", err, stdout, stderr)
		if (err) {
			d.resolve(err + stderr + stdout)
		} else {
			d.resolve(stdout)
		}
	})
	return d.promise
}

doAction = function (name, action) {
	var command = 'node ' + dir + 'Assistant/DoAction.js "' + name + '" "' + action + '"'

	exec(command, function (err, stdout, stderr) {
		logger.info("DoAction: ", err, stdout, stderr)
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
		logger.info(ret)
		return ret
	}
}

getTimers = function () {
	var timers = fs.readdirSync(dir + "timers/")
	var ret = [];
	logger.info(timers);
	timers.forEach(function (timer) {
		var item = fs.readFileSync(dir + "timers/" + timer, 'utf8')
		var obj = {}
		obj.id = timer
		obj.date = new Date(timer * 1000).toString().split(" GMT")[0];
		obj.device = item.split(":")[0]
		obj.action = item.split(":")[1]
		ret.push(obj)
	})
	logger.info(ret);
	return ret

}

deleteTimer = function (timer) {
	logger.info(timer)
	fs.unlinkSync(dir + "timers/" + timer)
}

app.get('/', function (req, res) {
	res.sendfile('./public/index.html');
});
app.route('/api/timers/').get((req, res) => {
	res.send(getTimers());
});
app.route('/api/timers/:timer').get((req, res) => {
	const requestedTimer = req.params['timer'];
	res.send(deleteTimer(requestedTimer));
});
app.route('/api/devices/').get((req, res) => {
	res.send(devices);
});
app.route('/api/devices/:name').get((req, res) => {
	const requesteddevice = req.params['name'];
	res.send(getdevice(requesteddevice));
});
app.route('/api/device/:name/Logs/').get((req, res) => {
	const requesteddevice = req.params['name'];
	getLogs(getdevice(requesteddevice)).then(function (log) {
		res.send(log);
	})
})
app.route('/api/device/:name/ping/').get((req, res) => {
	const requesteddevice = req.params['name'];
	pingDevice(getdevice(requesteddevice)).then(function (status) {
		res.send(status);
	})
})
app.route('/api/device/:name/:action').get((req, res) => {
	const devicename = req.params['name'];
	const device = getdevice(devicename)
	const action = req.params['action'];
	if (device.functions.indexOf(action) < 0) {
		logger.error("ACTION NOT FOUND", action)
		res.send("ACTION NOT FOUND");
	}
	device.ids.forEach(function (id) {
		logger.info(id, action)
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
				linuxControl(device, action);
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
	logger.info("timer", device.name, action, timer)
	createTimer(device.name, action, timer, device.type);
	res.send("Complete");
});

