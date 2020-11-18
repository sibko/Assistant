const fs = require('fs')
const http = require('http');
const querystring = require('querystring');
const q = require("q");
const os = require("os")
const request = require("request");
const exec = require('child_process').exec;

var confdir = '/home/pi/Assistant/config.json'
if (os.hostname() == 'Microserver') {
    confdir = '/home/sibko/Assistant/config.json'
}
var config = fs.readFileSync(confdir, 'utf8')
config = JSON.parse(config)

var hosts = config.ir.hosts
var devices = config.devices
var irDevices = config.ir.devices
var plugDevices = config.plugs
var espPlugs = config.ESPplugs
console.log(Object.keys(irDevices))

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

var sendESP433 = function (host, code, length, attempts, protocol) {
    var _d = q.defer()
    var getquery = { "code": code, "length": length, "attempts": attempts, "protocol": protocol }
    var query = querystring.stringify(getquery);
    console.log("sending " + host + '/Transmit433?code=' + code + '&length=' + length + '&attempts=' + attempts + '&protocol=' + protocol)
    request('http://' + host + '/Transmit433?' + query, function (err, res, body) {
        console.log("Received: " + body)
        if (err) {
            _d.reject(err)
        } else {
            console.log(body);
            _d.resolve();
        }
    });
    return _d.promise
}
var sendESP433Manual = function (host, code, longOnDelay, longOffDelay, shortOnDelay, shortOffDelay, bigOn, bigOff, endDelay, attempts) {
    var _d = q.defer()
    var getquery = { "code": code, "longon": longOnDelay, "longoff": longOffDelay, "shorton": shortOnDelay, "shortoff": shortOffDelay, "bigon":bigOn, "bigoff": bigOff, "enddelay":endDelay, "attempts": attempts }
    var query = querystring.stringify(getquery);
    console.log("sending " + host + '/Transmit433?' + querystring.stringify(getquery))
    request('http://' + host + '/Transmit433?' + query, function (err, res, body) {
        console.log("Received: " + body)
        if (err) {
            _d.reject(err)
        } else {
            console.log(body);
            _d.resolve();
        }
    });
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
            command = "echo sudo updatedb --netpaths='/music' | ssh " + device.user + "@" + device.ip
            break;
        case 'createplaylists':
            command = "cd /music && bash createplaylists.sh &"
            break;
        case 'customplaylistsconverter':
            command = "bash " + dir + "Assistant/customPlaylistConverter.sh; updatedb --netpaths='/music' "
            break;
    }
    exec(command, function (err, stdout, stderr) {
        console.log(err, stdout, stderr)
        _d.resolve();
    })
    return _d.promise

}


var processActions = function (device, actions) {
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
				if (plugDevices[type][id + action]) {
					plugDevice = plugDevices[type]
					return;
				}
			})
	                console.log(plugDevice)
	                if (action != 'dim' && action != 'bright' && !plugDevice[id + action]) {
	                    console.log("ACTION NOT FOUND")
	                    return
	                }
	                var code = plugDevice[id + action]
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
	                var host = plugDevices.hosts[hostname]
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
	                    var promise = sendESP433Manual(host, code, longOnDelay, longOffDelay, shortOnDelay, shortOffDelay, bigOn, bigOff, endDelay, attempts)
	                } else {
	                    var promise = sendESP433(host, code, length, attempts, protocol);
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
        }

    })

    return q.all(promises);
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



