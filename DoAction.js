const fs = require('fs')
const http = require('http');
const querystring = require('querystring');
const q = require("q");
const os = require("os")
const request = require("request");
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
var confdir = '/home/pi/Assistant/config.json'
if (os.hostname() == 'myNode') {
    confdir = '/home/sibko/Assistant/config.json'
}
var config = fs.readFileSync(confdir, 'utf8')
config = JSON.parse(config)

//#region CATFLAP
var endpoint = "app.api.surehub.io"
var loginURL = "/api/auth/login"
var sessionToken = ""
const device_id = "9123499999"
const https = require('https')

var credentialsdir = '/home/pi/Assistant/credentials.json'
if (os.hostname() == 'myNode') {
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

var getPetLocation = function (name) {
    return new Promise(function(resolve, reject) {
        pets.forEach(function(pet){ 
            if (pet.name == name) {
                var getPetLocationURL = "/api/pet/"+ pet.id + "/position"
                sendGetRequest(getPetLocationURL).then(function (res) {
                    var location = "outside"
                    if (res.data.where == "1") location = "inside"
			console.log('mplayer /music/music/assistant' + pet.name + location +'.mp3')
                    execSync('mplayer /music/assistant' + pet.name + location +'.mp3')
                    resolve()
                })
            }               
        }) 
    })       
}
//#endregion


var hosts = config.ir.hosts
var devices = config.devices
var irDevices = config.ir.devices
var plugDevices = config.plugs
var espPlugs = config.ESPplugs

var getdevice = function (requested) {
    var ret = ''
    devices.forEach(function (device) {
        if (device.name.replace(" ", "").toLowerCase() == requested.replace(" ", "").toLowerCase()) {
            return ret = device;
        }
        device.aliases.forEach(function (alias) {
            if (alias.replace(" ", "").toLowerCase() == requested.replace(" ", "").toLowerCase()) {
                return ret = device
            }
        })
    })
    if (ret == '') {
        console.log('DEVICE NOT FOUND', requested)
        throw 'device not found';
    } else {
        console.log(ret)
        return ret
    }
}

var sendESPRequest = function (id, action) {
    var defer = q.defer()
    console.log(id, action)
    http.get({
        host: id,
        path: '/' + action.toLowerCase()
    }, function (response) {
        console.log("received response ", response.statusCode)
        defer.resolve();
    })
    return defer.promise
}

var sendESP433 = function (hostname, code, length, attempts, protocol) {
    var _d = q.defer()
    var getquery = { "code": code, "length": length, "attempts": attempts, "protocol": protocol }
    var query = querystring.stringify(getquery);
    console.log("sending " + hostname + '/Transmit433?code=' + code + '&length=' + length + '&attempts=' + attempts + '&protocol=' + protocol)
	if (hostname == 'all') {
		Object.keys(plugDevices.hosts).forEach(function(host, i) {
			console.log(plugDevices.hosts[host])
				setTimeout(function() {
					request('http://' + plugDevices.hosts[host] + '/Transmit433?' + query, function (err, res, body) {
			        console.log("Received: " + body)
			        if (err) {
			            _d.reject(err)
			        } else {
			            console.log(body);
			            _d.resolve();
			        }
			});
				}, i * 1000)
		})
	} else {

		request('http://' + plugDevices.hosts[hostname] + '/Transmit433?' + query, function (err, res, body) {
		        console.log("Received: " + body)
        		if (err) {
		            _d.reject(err)
	        	} else {
		            console.log(body);
		            _d.resolve();
		        }
		});
	}
    return _d.promise
}
var sendESP433Manual = function (hostname, code, longOnDelay, longOffDelay, shortOnDelay, shortOffDelay, bigOn, bigOff, endDelay, attempts) {
    var _d = q.defer()
    var getquery = { "code": code, "longon": longOnDelay, "longoff": longOffDelay, "shorton": shortOnDelay, "shortoff": shortOffDelay, "bigon":bigOn, "bigoff": bigOff, "enddelay":endDelay, "attempts": attempts }
    var query = querystring.stringify(getquery);
    console.log("sending " + hostname + '/Transmit433?' + querystring.stringify(getquery))

	if (hostname == 'all') {
                Object.keys(plugDevices.hosts).forEach(function(host, i) {
			setTimeout(function(){
				request('http://' + plugDevices.hosts[host] + '/Transmit433?' + query, function (err, res, body) {
			        console.log("Received: " + body)
		        	if (err) {
			            _d.reject(err)
			        } else {
			            console.log(body);
			            _d.resolve();
			        }
		        });
			}, i*1000)
		})
	} else {
		request('http://' + plugDevices.hosts[hostname] + '/Transmit433?' + query, function (err, res, body) {
                                console.log("Received: " + body)
                                if (err) {
                                    _d.reject(err)
                                } else {
                                    console.log(body);
                                    _d.resolve();
                                }
                        });
	}
    return _d.promise
}

var sendIRRequest = function (host, action) {
    var _d = q.defer();

    const postData = querystring.stringify({ 'simple': 1, 'plain': action });
    console.log("ADAM ", host, action)
    const options = {
        hostname: hosts[host],
        port: 80,
        path: '/json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    console.log(options, postData)
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

linuxControl = function (device, action) {
    var _d = q.defer();
    var command = ""
    switch (action) {
        case 'restartassistant':
            command = "echo sudo systemctl restart assistant | ssh " + device.user + "@" + device.ip
            break;
        case 'restart':
            command = "echo sudo shutdown -r now | ssh " + device.user + "@" + device.ip
            break;
        case 'off':
            command = "echo sudo shutdown -h now | ssh " + device.user + "@" + device.ip
            break;
        case 'updatemusic':
            command = "echo sudo updatedb --netpaths='/mnt/bigfucker/Music' | ssh " + device.user + "@" + device.ip
            break;
        case 'createplaylists':
            command = "cd /mnt/bigfucker/Music && bash createplaylists.sh &"
            break;
        case 'customplaylistsconverter':
            command = "bash " + dir + "Assistant/customPlaylistConverter.sh; updatedb --netpaths='/mnt/bigfucker/Music' "
            break;
	case 'volumeup':
	    command = "echo 'sudo amixer set -M Headphone 10%+' | ssh " + device.user + "@" + device.ip
	    break;
	case 'volumedown':
	    command = "echo 'sudo amixer set -M Headphone 10%-' | ssh " + device.user + "@" + device.ip
	    break;
    }
    exec(command, function (err, stdout, stderr) {
        console.log(err, stdout, stderr)
        _d.resolve();
    })
    return _d.promise

}


var processActions = function (device, actions) {
    if (device == "catflap") {
        if (actions[0] == "all") {
            return login().then(getPetLocation("henry")).then(getPetLocation("eddie")).then(getPetLocation("elwood"))
        } else {
            return login().then(getPetLocation(actions[0]))
        }
    }
    var promises = [];
    actions.forEach(function (action) {
        action = action.replace(" ", "").toLowerCase()
        if (action == 'sauce') {
            action = 'source'
        }
        console.log(device + action);

        var dev = '';
        dev = getdevice(device, 'name');


        if (action == 'off' && dev.type == 'infrared') {
            action = 'on'
        }
        console.log(dev.type)
        switch (dev.type) {
            case '433':
		dev.ids.forEach(function(id){
	                var plugDevice = {}
			Object.keys(plugDevices).forEach(function(type){
				if (plugDevices[type].actions && plugDevices[type].actions[id + action]) {
					plugDevice = plugDevices[type]
					return;
				}
			})
	                console.log(plugDevice)
	                if (action != 'dim' && action != 'bright' && !(plugDevice.actions || plugDevice.actions[id + action])) {
	                    console.log("ACTION NOT FOUND")
	                    return
	                }
	                var code = plugDevice.actions[id + action]
	                var attempts = plugDevice.attempts;
	                var length = plugDevice.length;
			var protocol = plugDevice.protocol
	                if (!protocol || protocol == "") protocol = 1;
	                var hostname = dev.host
	                if (hostname == undefined) {
	                    switch (dev.location) {
	                        case 'Lounge':
	                        case 'Bedroom':
	                        case 'Mobile':
	                        case 'Front Bedroom':
	                            hostname = 'upstairs'
	                            break;
	                        case 'Kitchen':
	                        case 'Sitting Room':
	                        case 'Dining Room':
	                        case 'Breakfast Room':
	                        case 'Hall':
	                        case 'Garden':
	                        case 'Garage':
	                            hostname = 'downstairs'
	                            break;
	
	                    }
	                }
	//                if (action == 'bright' || action == 'dim') {
	  //                  attempts = 25
	    //                code = plugDevice['x10' + action]
	      //          }
	                if (plugDevice.manual) {                    
	                    var longOnDelay = plugDevice.longOnDelay * 1000000
	                    var longOffDelay = plugDevice.longOffDelay * 1000000
	                    var shortOnDelay = plugDevice.shortOnDelay * 1000000
	                    var shortOffDelay = plugDevice.shortOffDelay * 1000000
	                    var bigOn = plugDevice.bigOn * 1000000
	                    var bigOff = plugDevice.bigOff * 1000000
	                    var extendedDelay = plugDevice.extendedDelay * 1000000
	                    var endDelay = plugDevice.endDelay * 1000000
	                    var promise = sendESP433Manual(hostname, code, longOnDelay, longOffDelay, shortOnDelay, shortOffDelay, bigOn, bigOff, endDelay, attempts)
	                } else {
	                    var promise = sendESP433(hostname, code, length, attempts, protocol);
	                }
	                promises.push(promise)
	                
		})
			break;
            case 'infrared':
                var functions = dev.functions.map(function (item) {
                    return item.replace(" ", "").toLowerCase()
                })
                if (functions.indexOf(action) < 0) {
                    console.log("ACTION NOT FOUND")
                    return
                }
                console.log(dev.ids[0], irDevices[dev.ids[0]])
                var promise = sendIRRequest(irDevices[dev.ids[0]].host, irDevices[dev.ids[0]][action])
                promises.push(promise);
                break
            case 'ESP':
                var functions = dev.functions.map(function (item) {
                    return item.replace(" ", "").toLowerCase()
                })
                if (functions.indexOf(action) < 0) {
                    console.log("ACTION NOT FOUND")
                    return
                }
                var promise = sendESPRequest(dev.ids[0], action);
                promises.push(promise);
                break
            case 'legacy433':
                var plugDevice = plugDevices[dev.type]
                console.log(plugDevice)
                if (action != 'dim' && action != 'bright' && !plugDevice[dev.ids[0] + action]) {
                    console.log("ACTION NOT FOUND")
                    return
                }
                var code = plugDevice[dev.ids[0] + action]
                var attempts = 10
                if (action == 'bright' || action == 'dim') {
                    attempts = 25
                    code = plugDevice['x10' + action]
                }
                var shortOnDelay = plugDevice.shortOnDelay
                var shortOffDelay = plugDevice.shortOffDelay
                var longOnDelay = plugDevice.longOnDelay
                var longOffDelay = plugDevice.longOffDelay
                var bigOn = plugDevice.bigOn
                var bigOff = plugDevice.bigOff
                var extendedDelay = plugDevice.extendedDelay
                var endDelay = plugDevice.endDelay
		var protocol = plugDevice.protocol
		if (!protocol || protocol == "") protocol = 1;
                console.log(os.hostname(), dev.type, os.hostname() == 'bedroomAssistant', dev.type == 'x10')
                console.log('python /home/pi/Assistant/Transmit433.py ' + code + ' ' + attempts + ' ' + shortOnDelay + ' ' + shortOffDelay + ' ' + longOnDelay + ' ' + longOffDelay + ' ' + bigOn + ' ' + bigOff + ' ' + extendedDelay + ' ' + endDelay + ' ' + protocol)
                if (os.hostname() == 'bedroomAssistant' && dev.type == 'x10') {
                    exec('echo "python /home/pi/Assistant/Transmit433.py ' + code + ' ' + attempts + ' ' + shortOnDelay + ' ' + shortOffDelay + ' ' + longOnDelay + ' ' + longOffDelay + ' ' + bigOn + ' ' + bigOff + ' ' + extendedDelay + ' ' + endDelay + '"| ssh pi@192.168.0.187')
                } else if (os.hostname() == 'Microserver') {
                    exec('echo "python /home/pi/Assistant/Transmit433.py ' + code + ' ' + attempts + ' ' + shortOnDelay + ' ' + shortOffDelay + ' ' + longOnDelay + ' ' + longOffDelay + ' ' + bigOn + ' ' + bigOff + ' ' + extendedDelay + ' ' + endDelay + '"| ssh pi@192.168.0.187')
                } else {
                    exec('python /home/pi/Assistant/Transmit433.py ' + code + ' ' + attempts + ' ' + shortOnDelay + ' ' + shortOffDelay + ' ' + longOnDelay + ' ' + longOffDelay + ' ' + bigOn + ' ' + bigOff + ' ' + extendedDelay + ' ' + endDelay)
                }
                break;
            case 'rPI':
                var functions = dev.functions.map(function (item) {
                    return item.replace(" ", "").toLowerCase()
                })
                if (functions.indexOf(action) < 0) {
                    console.log("ACTION NOT FOUND")
                    return
                }
                var promise = linuxControl(dev, action)
                promises.push(promise);
                break
	    case 'HA':
		var functions = dev.functions.map(function (item) {
                    return item.replace(" ", "").toLowerCase()
                })
                if (functions.indexOf(action) < 0) {
                    console.log("ACTION NOT FOUND")
                    return
                }
		dev.ids.forEach(function(id){
                            var promise = sendToHA(id, action);
                        promises.push(promise)

                })
                        break;

        }

    })

    return q.all(promises);
}
var sendToHA = function(id, action) {
	var domain = id.split(".")[0]
	switch (action.toLowerCase()) {
		case 'on':
			action = 'turn_on'
			break;
		case 'off':
			action = 'turn_off'
			break;
	}


var options = {
  'method': 'POST',
  'hostname': '192.168.0.180',
  'port': 8123,
  'path': '/api/services/' + domain + '/' + action,
  'headers': {
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJiMDc3NzFiY2Q5ZmI0M2YyOTQwMDRhMDFjODJjMzQzZCIsImlhdCI6MTY1NjA4NjgxMCwiZXhwIjoxOTcxNDQ2ODEwfQ.VAvOjUNtwMbbsq-xe7WiVFYm3AbeG8S7EHhJtHUBnTM',
    'Content-Type': 'application/json'
  },
  'maxRedirects': 20
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function (chunk) {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });

  res.on("error", function (error) {
    console.error(error);
  });
});

var postData = JSON.stringify({
  "entity_id": id
});

req.write(postData);

req.end();



}

var device = process.argv[2];
var actions = process.argv.slice(3);
console.log("Received ", device, actions)

var origAction = actions[0];
processActions(device, actions).then(function () {
    console.log(device, origAction)
    if ((device == 'color' || device == 'colorlight') && origAction == 'off') {
        sendRequest(irDevices[device], 'on')
        sendRequest(irDevices[device], 'flashoff')
    }
})

