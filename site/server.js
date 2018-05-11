const express = require('express');

const app = express();
const fs = require('fs')
app.listen(1966, () => {
  console.log('Server started!');
});

var devices = fs.readFileSync('/home/pi/Assistant/newdevices.conf', 'utf8')
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

app.route('/api/devices/').get((req, res) => {
	res.send(devices);
});
app.route('/api/devices/:name').get((req, res) => {
	const requesteddevice = req.params['name'];
	res.send(getdevice(requesteddevice));
});
