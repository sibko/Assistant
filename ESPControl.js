
const fs = require('fs')
const http = require('http');
const querystring = require('querystring');
const q = require("q");

var config = fs.readFileSync('/home/pi/Assistant/config.json', 'utf8')
config = JSON.parse(config)
var devices = config.devices;

var sendRequest = function (device, action) {
    var defer = q.defer()
    http.get({
        host: 'device',
        path: '/' + action.toLowerCase()
    }, function (response) {
        console.log("received response ", response.statusCode)
        defer.resolve();
    })
    return defer.promise
}

var getdevice = function (requested) {
    var ret = ''
    devices.forEach(function (device) {
            if (device.name == requested) {
                return ret = device;
            }
            device.aliases.forEach(function (alias) {
                if (alias == requested) {
                    return ret = device
                }
            })
    })
    if (ret == '') {
        console.log('DEVICE NOT FOUND', device)
        throw 'device not found';
    } else {
        console.log(ret)
        return ret
    }
}

var processActions = function (device, actions) {
    var chain = q.when();
    actions.forEach(function (action) {
        chain = chain.then(function () {
            console.log(device + action);
            var dev = '';
            dev = getdevice(device, 'name');

            if (dev.type != 'ESP') {
                console.log("DEVICE NOT FOUND", dev)
                return
            }
            if (dev.functions.indexOf(action) < 0) {
                console.log("ACTION NOT FOUND", dev, action)
                return
            }
            return sendRequest(dev.ids[0], action);
        })
    })
}

var device = process.argv[2];
var actions = process.argv.slice(3);
console.log("Received ", device, actions)

processActions(device, actions)

