const fs = require('fs')
const confFile = '/home/sibko/Assistant/config.json'
const execSync = require('child_process').execSync;
var doActionFile = '/home/sibko/Assistant/DoAction.js'
var config = {}
config = fs.readFileSync(confFile, 'utf8')
config = JSON.parse(config)
var groups = config.groups
var devices = config.devices
var timers = config.timers
var daylightTimes = config.daylightTimes
var updated = false
var toDelete =[]

timers.forEach(function(timer, timerIndex) {
	console.log(timer)
	var today = new Date();
	console.log(timer.currentDay, timer.currentDay == today.getDay())
	if (timer.currentDay != undefined && timer.currentDay == today.getDay()) {
		console.log("RETURN")
		return 
	}
	if (timer.timePreset && timer.timePreset != "") {
		var timestampToBeat
		if (timer.timePreset == "none") {
			timestampToBeat = new Date(today.toDateString())
			timestampToBeat = timestampToBeat.getTime() + timer.time
		} else {
			timestampToBeat = daylightTimes[today.toLocaleDateString()][timer.timePreset]
		}
		console.log("BEAT" ,timestampToBeat)
		if (timer.daysPreset == "daily" || ( timer.daysPreset == "weekend" && (today.getDay() ==6 || toda.getDat() == 0) ) || (timer.daysPreset == "custom" && timer.days.indexOf(today.getDay()) >= 0)) {
			console.log(today.getTime(), timestampToBeat)
			if (today.getTime() > timestampToBeat) {
				var command = 'node ' + doActionFile + ' "' + timer.deviceName + '" "' + timer.action + '"'
				console.log(command)
			        for (var i=0;i < 3; i++) {
					var res = execSync(command).toString()
			                console.log("DoAction", res)
					timer.currentDay = today.getDay()
					updated = true
				}
			        
				
			}
		}
	} else if (timer.triggerAt && timer.triggerAt < today.getTime()) {
		if (timer.action == 'URL') {
			var command = 'curl ' + timer.deviceName 
			var res = execSync(command)
	        console.log("URL Timer", res.toString())
			updated = true
		} else {
			var command = 'node ' + doActionFile + ' "' + timer.deviceName + '" "' + timer.action + '"'

                        for (var i=0;i < 3; i++) {
				var res = execSync(command)
	                        console.log("DoAction", res.toString())
				updated = true
			}
		}
		toDelete.push(timer.id)
	}
})
var motionDetection = config.motionDetection || {}
var motions = Object.keys(motionDetection);
var now = new Date()
console.log(motionDetection)
if (!motions || motions.length < 1) return
motions.forEach(function (id) {
	if (!motionDetection[id].processed &&  motionDetection[id].timeout && motionDetection[id].timeout > 0 && motionDetection[id].timeout * 60000 + motionDetection[id].lastDetection < now.getTime()) {
		for (var i=0;i < motionDetection[id].repeat; i++) {
			console.log(i, motionDetection[id].repeat)
			motionDetection[id].actionsOnTimeout.forEach(function(action) {
				var command = 'node ' + doActionFile + ' "' + action.device + '" "' + action.action + '"'
		                var res = execSync(command)
	        	        console.log("DoAction", res.toString())
			})
		}
		motionDetection[id].processed = true
		updated = true
	}
})
if (toDelete.length > 0 || updated) {
        toDelete.forEach(function (id) {
                timers.forEach(function (timer, timerIndex) {
                        if (timer.id == id) {
                                config.timers.splice(timerIndex,1)
                                return
                        }
                })
        })
        fs.writeFileSync(confFile, JSON.stringify(config,null,2))
}

