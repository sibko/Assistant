var req = require('request')
var fs = require('fs')
var data = {}
req('https://www.visitnorthwest.com/sunrise-sunset-times/sunderland/', function (error, response, body) {
	if(error) throw error;
	if (body) {		
		var table = body.split('tablepress responsive')[1].split('/table')[0]
		var rows = table.split('<tr>')
		rows.forEach(function (row) {
			if(row.indexOf('<td>') > -1 ) {
				var rdate = new Date(row.split('<td>')[1].split('</td>')[0]);
				var sunrise = row.split('<td>')[2].split('</td>')[0];
				var sunriseDate = new Date(new Date(new Date(rdate).setHours(sunrise.split(':')[0])).setMinutes(sunrise.split(':')[1].split(' ')[0]))
				var sunset = row.split('<td>')[3].split('</td>')[0];
				var sunsetDate = new Date(new Date(new Date(rdate).setHours(parseInt(sunset.split(':')[0]) + 12)).setMinutes(sunset.split(':')[1].split(' ')[0]))
				console.log("DATE: ", rdate, " - sunrise: ", sunriseDate, " - sunset: ", sunsetDate, sunrise, sunset)
				var seconds = rdate.toLocaleDateString()
				data[seconds] = {}
				data[seconds].sunrise = sunriseDate.getTime()
				data[seconds].sunset = sunsetDate.getTime()
			}
		})		
		console.log(data)
		var config = {}
		var confFile = '/home/sibko/Assistant/config.json'
		config = fs.readFileSync(confFile, 'utf8')
		config = JSON.parse(config)
		config.daylightTimes = data
		fs.writeFileSync(confFile, JSON.stringify(config,null,2))
	}
})
