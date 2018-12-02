const fs = require('fs')
const http = require('http');
const querystring = require('querystring');
const q = require("q");
const os = require("os")
const request = require("request");
const exec = require('child_process').exec;


var config = fs.readFileSync('/home/pi/Assistant/config.json', 'utf8')
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

var sendESP433 = function (host, code, length, attempts, binary) {
	var _d = q.defer()
	var getquery = { "code": code, "length": length, "attempts": attempts }
	var query = querystring.stringify(getquery); 
	console.log("sending " + host + '/Transmit433?code=' + code + '&length=' + length + '&attempts=' + attempts)
	request('http://' + host + '/Transmit433?' + query, function(err, res, body) {  
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
            command = "echo sudo systemctl restart assistant | ssh " + device.user + "@" + device.ids[0]
	        break;
	    case 'restart':
            command = "echo sudo shutdown -r now | ssh " + device.user + "@" + device.ids[0]
            break;
        case 'off':
            command = "echo sudo shutdown -h now | ssh " + device.user + "@" + device.ids[0]
            break;
        case 'updatemusic':
            command = "echo sudo updatedb --netpaths='/music' | ssh " + device.user + "@" + device.ids[0]
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
           case 'esp433Floureon':
            	var plugDevice = plugDevices[dev.type]
                console.log(plugDevice)
                if (action != 'dim' && action != 'bright' && !plugDevice[dev.ids[0] + action]) {
                    console.log("ACTION NOT FOUND")
                    return
                }
                var code = plugDevice[dev.ids[0] + action]
                var attempts = plugDevice.attempts;
		var length = plugDevice.length;
		var host = plugDevices.hosts[dev.host]
                if (action == 'bright' || action == 'dim') {
                    attempts = 25
                    code = plugDevice['x10' + action]
                }
                var promise = sendESP433(host, code, length, attempts);
		promises.push(promise)
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
            case 'generic':
            case 'energenie':
            case 'x10':
            case 'twelvevolt':
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
                console.log(os.hostname(), dev.type, os.hostname() == 'bedroomAssistant', dev.type == 'x10')
                console.log('python /home/pi/Assistant/Transmit433.py ' + code + ' ' + attempts + ' ' + shortOnDelay + ' ' + shortOffDelay + ' ' + longOnDelay + ' ' + longOffDelay + ' ' + bigOn + ' ' + bigOff + ' ' + extendedDelay + ' ' + endDelay)
                if (os.hostname() == 'bedroomAssistant' && dev.type == 'x10') {
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



