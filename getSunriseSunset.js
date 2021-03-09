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
				var seconds = "z" + (rdate.getTime() / 1000).toString().split('.')[0]
				data[seconds] = {}
				data[seconds].sunrise = (sunriseDate.getTime() / 1000).toString().split('.')[0]
				data[seconds].sunset = (sunsetDate.getTime() / 1000).toString().split('.')[0]
			}
		})		
		fs.writeFileSync('./sunriseSunset', JSON.stringify(data))
	}
})
