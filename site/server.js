const express = require('express');
const log4js = require('log4js')
const app = express();
const fs = require('fs')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const http = require('http');
const querystring = require('querystring');
const q = require("q");
const os = require("os");
var dir = '/home/pi/'
const path = require('path')

if (os.hostname() == 'Microserver') {
	dir = '/home/sibko/'
}

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

app.use(morgan({ "format": "default", "stream": { write: function (str) { logger.debug(str); } } }));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.listen(1966, () => {
	logger.info('Server started!');
});
var config = {}
var groups
var devices
var loadConfig = function () {
	config = fs.readFileSync(dir + 'Assistant/config.json', 'utf8')
	config = JSON.parse(config)
	groups = config.groups
	devices = config.devices
}
var updateConfig = function (newConfig, writeMotion) {
	Object.keys(config).forEach(function(key) {
		if (writeMotion || key != "motionDetect") {
			config[key] = newConfig[key]
		}
	})
	fs.writeFileSync(dir + 'Assistant/config.json', JSON.stringify(config,null,2))
}
fs.watchFile(dir + 'Assistant/config.json', function (curr, prev) {
	logger.info("change to config")
	loadConfig()
})
var getFreePlugs = function(config, includeHidden) {
	var freeIDs = {}
	Object.keys(config.plugs).forEach(function(plug){
		if (config.plugs[plug].actions) {
			freeIDs[plug] = config.plugs[plug].actions
		}
	})
	config.devices.forEach(function (dev){
		if (dev.type && dev.type == "433" && (!dev.hidden || (dev.hidden && includeHidden))){
			dev.ids.forEach(function (id) {
				Object.keys(freeIDs).forEach(function (type){
					Object.keys(freeIDs[type]).forEach(function (action){
						if (action.includes(id)) {
							delete freeIDs[type][action]
						}
					})
				})
			})
		}
	})
	return freeIDs
}

loadConfig()
var item = fs.readFileSync(dir + "Assistant/popular.json", 'utf8')
var poplist = JSON.parse(item)

createSimpleTimer = function (timer) {
	var timestamp = timer.minutes * 60 * 1000
        var now = new Date()
        timestamp += now.getTime()
        config.timers.push({
	        deviceName: timer.device.name,
                action: timer.action,
                triggerAt: timestamp,
                id: now.getTime()
        })
        updateConfig(config, true)
	logger.info(timer)
}

restartServer = function () {
	var command = 'service DeviceList restart'
        exec(command, function (err, stdout, stderr) {logger.info(err, stdout)})
}

getLogs = function (device) {
	var d = q.defer()
	var command = 'echo "tail -n 500 /home/pi/assLogs.log | tac" | ssh -q ' + device.user + '@' + device.ip
	if (device.name && device.name == 'Microserver') {
		command = "tail -n 500 /home/sibko/logs/server.log | tac"
	}
	exec(command,{maxBuffer: 1024 * 1000}, function (err, stdout, stderr) {
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
	var command = 'ping -c 2 ' + device.ip
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
getgroup = function (requested) {
	var ret = ''
	groups.forEach(function (group) {
		if (group.name == requested) {
			return ret = group;
		}
	})
	if (ret == '') {
		throw 'group not found';
	} else {
		logger.info(ret)
		return ret
	}
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
	var timers = config.timers
	var ret = [];
	logger.info(timers);
	timers.forEach(function (timer) {
		var item = fs.readFileSync(dir + "timers/" + timer, 'utf8')
		var obj = {}
		obj.id = timer
		if (isNaN(timer)) {
			obj.timepreset = timer.split("-")[0]
			obj.dayspreset = item.split(":")[3]
			var days = item.split(":")[5]
			obj.days=""
			days.split(",").forEach(function(day){
				if (day == 1) obj.days += "Mon/"
				if (day == 2) obj.days += "Tue/"
				if (day == 3) obj.days += "Wed/"
				if (day == 4) obj.days += "Thu/"
				if (day == 5) obj.days += "Fri/"
				if (day == 6) obj.days += "Sat/"
				if (day == 7) obj.days += "Sun/"
			})
			
			var time = item.split(":")[6]
			if (time && time > 0) {
				var today= new Date()
				today.setMinutes(0)
				today.setHours(0)
				today.setSeconds(0)
				var todaystime = new Date(today.getTime() + time * 1000)
				obj.time= todaystime.getHours() + ":" + todaystime.getMinutes()
			}
		} else {
			obj.date = new Date(timer * 1000).toString().split(" GMT")[0];
		}
		obj.device = item.split(":")[0]
		obj.action = item.split(":")[1]
		ret.push(obj)
	})
	logger.info(ret);
	return ret

}

logAction = function (device) {

	if (!poplist[device]) {
		poplist[device] = 0
	}
	poplist[device] += 1
	fs.writeFileSync(dir + "Assistant/popular.json", JSON.stringify(poplist), 'utf8')
}

deleteTimer = function (timer) {
	logger.info(timer)
	config.timers.forEach(function(conftimer, index){
		if (conftimer.id == timer) {
			config.timers.splice(index,1);
			updateConfig(config,true)
			return
		}
	})
}
var info = []
getDirTree = function(filename) {
	var stats = fs.lstatSync(filename)
	        
    if (stats.isDirectory()) {
        fs.readdirSync(filename).map(function(child) {
			getDirTree(filename + '/' + child)			
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
		// something else!
		var extension = filename.substring(filename.length -4).toLowerCase()
		var validFormats = ['.mp3', 'flac', '.wma', '.m4a', '.m3u', '.pls', '.asx', '.wav','.ogg']
		if (validFormats.indexOf(extension) >= 0) {
			info.push(filename);
		}
    }
}

app.get('/', function (req, res) {
	res.sendfile('./public/index.html');
});
app.route('/api/poplist/').get((req, res) => {
	res.send(poplist);
});
app.route('/api/timers/').get((req, res) => {
	res.send(config.timers);
});
app.route('/api/timers/:timer').get((req, res) => {
	const requestedTimer = req.params['timer'];
	res.send(deleteTimer(requestedTimer));
});
app.route('/api/groups/').get((req, res) => {
	res.send(groups);
});
app.route('/api/groups/:name').get((req, res) => {
	logger.info("got here")
	const groupname = req.params['name'];
	const group = getgroup(groupname)
	logger.info("group", group, groupname)	
	switch (group.type){
		case 'timer':
			group.ids.forEach(function (id, index){
				logger.info("timer", id, group.actions[index], group.minutes)
				createSimpleTimer({device: {name: id}, action: group.actions[index], minutes:group.minutes});
			})
			break;
		case 'simple':
			group.ids.forEach(function (id, index){
				doAction(id, group.actions[index])
			})
			break;
	}	
	res.send("Complete");
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
app.route('/api/motion/:id').get((req, res) => {
        var id = req.params['id'];
        var time = new Date()
	config.motionDetection = config.motionDetection || {}
	config.motionDetection[id] = config.motionDetection[id] || {}
	config.motionDetection[id].lastDetection = Math.round(time.getTime() / 1000)
	updateConfig(config, true)
        res.send("logged " + id + " " + time );
});
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
	logAction(devicename)
	if (device.functions.indexOf(action) < 0) {
		logger.error("ACTION NOT FOUND", action)
		res.send("ACTION NOT FOUND");
	}
	device.ids.forEach(function (id) {
		logger.info(id, action)
		switch (device.type) {
			case "infrared":
			case "ESP":
			case "rPI":
			case "433":
				doAction(device.name, action)
				break;
			case "espcamera":
				logger.info("CAMERA", action)
				if (action == 'On') {
					fs.writeFileSync(dir + "wakecamera", 'true', 'utf8')
				} 
				if (action =='Off') {
					fs.writeFileSync(dir + "wakecamera", 'false', 'utf8')
				}
				break;
		}
	})
	res.send("Complete");
});

var waiting = false
app.route('/api/getMusic/').get((req,res) => {
	if (info.length == 0) {
		getDirTree('/music/')
	}	
	res.send(info)
})
app.route('/api/getConfig/').get((req,res) => {
        res.send(config)
})
app.route('/api/getFreePlugs/:hidden').get((req,res) => {
	var freePlugs
	if (req.params['hidden'] && req.params['hidden'] == "true") {
		freePlugs = getFreePlugs(JSON.parse(JSON.stringify(config)), true)
	} else {
		freePlugs = getFreePlugs(JSON.parse(JSON.stringify(config)))
	}
	res.send(freePlugs)
})
app.route('/api/forceGetMusic/').get((req,res) => {
        info = []
	getDirTree('/music/')
        res.send(info)
})
app.route('/api/camera/').get((req,res) => {
        var item = fs.readFileSync(dir + "wakecamera", 'utf8')
	res.send(item)
})
app.route('/api/createTimer/').post((req,res) => {
        logger.info("new Timer", req.body)
	var timer = req.body
	config.timers = config.timers || []
	if (timer.minutes && timer.minutes > 0) {
		createSimpleTimer(timer)
	} else {
		var days = ""
		if (timer.days.monday) {
			days += "1,"
		}
		if (timer.days.tuesday) {
                        days += "2,"
                }
		if (timer.days.wednesday) {
                        days += "3,"
                }
		if (timer.days.thursday) {
                        days += "4,"
                }
		if (timer.days.friday) {
                        days += "5,"
                }
		if (timer.days.saturday) {
                        days += "6,"
                }
		if (timer.days.sunday) {
                        days += "7"
                }
		var time = 0
		if (timer.time.preset == "none" && timer.time.hours) {
			time = timer.time.hours * 60
			time = Number(time) + Number(timer.time.minutes|| 0)
			time = time * 60
		}
		var date = new Date()
		var timestamp = date.getTime()
		config.timers = config.timers || []
		config.timers.push(
			{
				deviceName: timer.device.name,
				action: timer.action,
				timestamp: Math.floor(timestamp),
				type: timer.device.type.toLowerCase(),
				daysPreset: timer.days.preset,
				timePreset: timer.time.preset,
				days: days,
				time: time,
				id: date.getTime(),
				currentDay: 8
			}
		)
		updateConfig(config)
	}
})
app.route('/api/updateConfig/').post((req,res) => {
	logger.info("New config", req.body)
	updateConfig(req.body)
	fs.writeFileSync(dir + 'Assistant/config.json', JSON.stringify(req.body,null,2))
	loadConfig()
	res.send("thank you")
})
app.route('/api/restartServer/').get((req,res) => {
	res.send("TAH")
	process.exit(1)
})
app.route('/api/updatePis/').get((req,res) => {
        res.send("TAH")
	var command = 'bash /home/sibko/Assistant/updateAll.sh'

        exec(command, function (err, stdout, stderr) {
                logger.info("updatepis: ", err, stdout, stderr)
        })
	
})


getDirTree('/music/')
