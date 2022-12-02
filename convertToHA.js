#!/usr/bin/node


var fs = require("fs")
var template = "bedroomtv_up: ssh -i /config/id_rsa -o 'StrictHostKeyChecking=no' sibko@127.0.0.1 '/usr/bin/node /home/sibko/Assistant/DoAction.js bedroomtv up'"
var config = JSON.parse(fs.readFileSync("config.json").toString())
console.log("IR DEVICES")
config.devices.forEach(function(dev){
	if (dev.type != "infrared") return 
	dev.functions.forEach(function(action){
		var ret = template
		ret = ret.replace(/up/g, action.toLowerCase().replace(" ", "")).replace(/bedroomtv/g, dev.ids[0])
		console.log("  " + ret)
	})
})
console.log("rPI Devices")
config.devices.forEach(function(dev){
        if (dev.type != "rPI") return
        dev.functions.forEach(function(action){
                if (action.toLowerCase().replace(" ", "") == "musicmanager") return
		var ret = template
                ret = ret.replace(/up/g, action.toLowerCase().replace(" ", "")).replace(/bedroomtv/g, dev.ids[0])
                console.log("  " + ret)
        })
})
console.log("ESP")
config.devices.forEach(function(dev){
        if (dev.type != "ESP") return
        dev.functions.forEach(function(action){
                var ret = template
                ret = ret.replace(/up/g, action.toLowerCase().replace(" ", "")).replace(/bedroomtv/g, dev.name.toLowerCase().replace(" ", ""))
                console.log("  " + ret)
        })
})

