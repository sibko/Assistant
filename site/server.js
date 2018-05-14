const express = require('express');

const app = express();
const fs = require('fs')
const morgan = require('morgan')
const bodyParser = require('body-parser')

app.use(morgan('dev'));   
app.use(express.static(__dirname + '/public'));  
app.use(bodyParser.urlencoded({'extended':'true'})); 
app.use(bodyParser.json());       
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.listen(1966, () => {
  console.log('Server started!');
});

var devices = fs.readFileSync('/test/Assistant/newdevices.conf', 'utf8')
devices=JSON.parse(devices)
console.log("loaded devices:")
devices.forEach(function(device){
	console.log(device.name)
})

getdevice = function(requested) {
	var ret = ''
	devices.forEach(function(device){
		if (device.name == requested) {
			return ret=device;
		}
	})
	if (ret == ''){
		throw 'device not found';
	} else {
		console.log(ret)
		return ret
	}
}

app.get('/', function(req, res) {
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
	device.ids.forEach(function(id) {
		console.log(id, action)
	})
	res.send("Complete");
});
