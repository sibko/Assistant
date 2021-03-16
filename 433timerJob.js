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
if (!timers || timers.length == 0) return

timers.forEach(function(timer, timerIndex) {
	console.log(timer)
	var today = new Date();
	if (timer.currentDay && timer.currentDay == today.getDay()) return 
	if (timer.timePreset && timer.timePreset != "") {
		var timestampToBeat
		if (timer.timePreset == "none") {
			timestampToBeat = new Date(today.toDateString())
			timestampToBeat = timestampToBeat.getTime() + timer.time
		} else {
			timestampToBeat = daylightTimes[today.toLocaleDateString()][timer.timePreset]
		}
		if (timer.daysPreset == "daily" || ( timer.daysPreset == "weekend" && today.getDay() >= 5 ) || (timer.daysPreset == "custom" && timer.days.indexOf(today.getDay()) >= 0)) {
			console.log(today.getTime(), timestampToBeat)
			if (today.getTime() > timestampToBeat) {
				var command = 'node ' + doActionFile + ' "' + timer.deviceName + '" "' + timer.action + '"'
				console.log(command)
			        var res = execSync(command).toString()
			                console.log("DoAction", res)
					timer.currentDay = today.getDay()
					updated = true
			        
				
			}
		}
	} else if (timer.triggerAt && timer.triggerAt < today.getTime()) {
		var command = 'node ' + doActionFile + ' "' + timer.deviceName + '" "' + timer.action + '"'

                                var res = execSync(command)
                                console.log("DoAction", res.toString())
				updated = true
				toDelete.push(timer.id)
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
