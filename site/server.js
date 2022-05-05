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
	exec(command,{maxBuffer: 1024 * 10000}, function (err, stdout, stderr) {
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
		devices.forEach(function (device) {
			device.ids.forEach(function (id){
				if (id.toLowerCase() == requested.toLowerCase()) {
					return ret = device;
				}
			})			
		})		
	}
	if (ret == '') {
		
		throw 'device not found';
	} else {
		logger.info(ret)
		return ret
	}
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
app.get('/api/catLocations', function(req,res){
	getCatLocations().then(function(locations) { res.send(locations)})
})
app.route('/api/poplist/').get((req, res) => {
	res.send(poplist);
});
app.route('/api/timers/').get((req, res) => {
	res.send(config.timers);
});
app.route('/api/motion/').get((req,res) => {
	res.send(config.motionDetection)
})
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
app.route('/api/rpiVolume/:name').get((req, res) => {
	const requesteddevice = req.params['name'];
	var ret = getdevice(requesteddevice).volume || 50
	res.send(ret.toString());
});
app.route('/api/rpiVolume/:name/:vol').get((req,res) => {
	const requesteddevice = req.params['name'];
	const vol = req.params['vol'];
	var ret = getdevice(requesteddevice)
	ret.volume = vol
	updateConfig(config)
	res.end()
})

var getTime = function(preset) {
	var daylightTimes = config.daylightTimes
	var today = new Date()
	return daylightTimes[today.toLocaleDateString()][preset]
}

app.route('/api/motion/:id').get((req, res) => {

	console.log("MOTION DETECTED")
        var id = req.params['id'];
	console.log(id)
        var time = new Date()
	logger.info(time.getHours())
	config.motionDetection = config.motionDetection || {}
	config.motionDetection[id] = config.motionDetection[id] || {}
	var motion = config.motionDetection[id]
	console.log(motion.lastDetection + (60000 * motion.timeout), time.getTime())
	console.log(motion)
	var fromTimestamp = 0
	var toTimestamp = 0
	var today = new Date()
        if (motion.fromPreset && motion.fromPreset != "custom") {
		fromTimestamp = getTime(motion.fromPreset)
	} else if (motion.fromHours && motion.fromHours != "") {
		var fromTime = motion.fromHours * 60
                fromTime = Number(fromTime) + Number(motion.fromMinutes|| 0)
                fromTime = fromTime * 60000
		fromTimestamp = new Date(today.toDateString())
                fromTimestamp = fromTimestamp.getTime() + fromTime
        }
	if (motion.toPreset && motion.toPreset != "custom") {
		toTimestamp = getTime(motion.toPreset)
	} else if (motion.toHours && motion.toHours != "") {
		 var toTime = motion.toHours * 60
                toTime = Number(toTime) + Number(motion.toMinutes || 0)
                toTime = toTime * 60000
		toTimestamp = new Date(today.toDateString())
                toTimestamp = toTimestamp.getTime() + toTime
	}
	console.log(fromTimestamp, toTimestamp, today.getTime())
	var withinTimeframe = false
	if (!motion.disabled && (fromTimestamp == 0  || fromTimestamp < today.getTime()) && (toTimestamp == 0 || toTimestamp > today.getTime()) ) {
		withinTimeframe = true;
		if ( motion.actionsOnFirstTrigger && motion.actionsOnFirstTrigger.length > 0 && motion.timeout && motion.lastDetection + (60000 * motion.timeout) < time.getTime()) {
			for (var i=0;i < motion.repeat; i++) {
				motion.actionsOnFirstTrigger.forEach(function(action){
					console.log("DOING ACTION", action.device, action.action)
					doAction(action.device, action.action);
				})
			}
		}
		if (motion.actionsOnEachTrigger && motion.actionsOnEachTrigger.length > 0) {
			for (var i=0;i < motion.repeat; i++) {
				motion.actionsOnEachTrigger.forEach(function(action) {
					console.log("DOING ACTION", action.device, action.action)
		                        doAction(action.device, action.action);
	        	        })
			}
		}
	}
	if(withinTimeframe){
		motion.lastDetection = time.getTime()
		motion.processed = false
		updateConfig(config, true)
	}
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
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	ip = ip.replace("::ffff:", "")
	var camFile = fs.readFileSync(dir + "wakecamera", 'utf8')
	var lines = camFile.toString().split("\n");
	var found = false
	lines.forEach(function (line){
		var camip = line.toString().split(" ")[0];
		if (camip == ip) {
			found = true
			res.send(line.toString().split(" ")[1])
			return
		}
	})
	if (!found) res.send("false")
})
app.route('/api/updateMotion/').post((req,res) => {
        logger.info("update Motion", req.body)
        var id = req.body.id
	var obj = req.body.obj
	config.motionDetection[id] = obj
	updateConfig(config)
})
app.route('/api/stopIn2Hours/').post((req, res) => {
    logger.info("stop in 2 hours", req.body)
    var url = req.body.url
    var timer = {
        minutes: 120,
        device: { name: url },
        action: "URL"
    }
    createSimpleTimer(timer)
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
			time = time * 60000
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

//#region CATFLAP
var endpoint = "app.api.surehub.io"
var loginURL = "/api/auth/login"
var sessionToken = ""
const device_id = "9123499999"
const https = require('https')

var credentialsdir = '/home/pi/Assistant/credentials.json'
if (os.hostname() == 'Microserver') {
    credentialsdir = '/home/sibko/Assistant/credentials.json'
}
var credentials = fs.readFileSync(credentialsdir, 'utf8')
credentials = JSON.parse(credentials)
if (credentials && credentials.surepet && credentials.surepet.sessionToken != "") sessionToken = credentials.surepet.sessionToken
var pets = credentials.surepet.pets

var sendPostRequest = function (url, data) {
    return new Promise(function (resolve, reject) {
        console.log("sending request for", url, data)
        var strData = JSON.stringify(data)
        var options = {
            hostname: endpoint,
            port: 443,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': strData.length
            }
        }
        if (sessionToken != "") options.headers.Authorization = "Bearer " + sessionToken

        var req = https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
            var resdata = ""
            res.on('data', d => {
                resdata += d
            })
            res.on('end', () => {
                console.log("Response:", resdata)
                var obj = JSON.parse(resdata)
                resolve(obj)
            })
        })

        req.on('error', error => {
            console.error(error)
            reject(error)
        })
        console.log("STRDATA", strData)
        req.write(strData)
        req.end()
    })
}
var sendGetRequest = function (url) {
    return new Promise(function (resolve, reject) {
        console.log("sending request for", url, sessionToken)
        var options = {
            hostname: endpoint,
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                Authorization: "Bearer " + sessionToken.toString()
            }
        }
        console.log("headers", options.headers)
        var req = https.request(options, res => {
            if (res.statusCode == 401) {                
                sessionToken = ""
		    credentials.surepet.sessionToken = ""
                fs.writeFileSync(credentialsdir, JSON.stringify(credentials))
                login().then(function(res){
                    sendGetRequest(url).then(function(){
                        resolve()
                    })
                })
            }
            var resdata = ""
            res.on('data', d => {
                resdata += d
            })
            res.on('end', () => {
                console.log("Response:", resdata)
                var obj = JSON.parse(resdata)
                resolve(obj)
            })
        })

        req.on('error', error => {
            console.error(error)
            reject(error)
        })
        req.end()
    })
}

var login = function () {
    return new Promise(function (resolve, reject) {
        if (sessionToken != "") resolve("already got")
        var data = {
            email_address: credentials.surepet.email,
            password: credentials.surepet.password,
            device_id: device_id
        }
        sendPostRequest(loginURL, data).then(function (res) {
            sessionToken = res.data.token            
		credentials.surepet.sessionToken = res.data.token
            fs.writeFileSync(credentialsdir, JSON.stringify(credentials))
            resolve("got new one")
        }).catch(function () {
            reject()
        })
    })
}

var getCatLocations = function (name) {
	return new Promise(function (resolve, reject) {
		var locations = {}
		locations[pets[0].name] = "Out"
		locations[pets[1].name] = "Out"
		locations[pets[2].name] = "Out"

		var getPetLocationURL = "/api/pet/" + pets[0].id + "/position"
		sendGetRequest(getPetLocationURL).then(function (res) {
			if (res.data.where == "1") locations[pets[0].name] = "In"
			getPetLocationURL = "/api/pet/" + pets[1].id + "/position"
			sendGetRequest(getPetLocationURL).then(function (res) {
				if (res.data.where == "1") locations[pets[1].name] = "In"
				getPetLocationURL = "/api/pet/" + pets[2].id + "/position"
				sendGetRequest(getPetLocationURL).then(function (res) {
					if (res.data.where == "1") locations[pets[2].name] = "In"
					resolve(locations)
				})
			})
		})

	})
}
//#endregion
