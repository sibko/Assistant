const express = require('express');
const log4js = require('log4js')
const app = express();
const fs = require('fs')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const execSync = require('child_process').execSync;
const http = require('http');
const querystring = require('querystring');
const q = require("q");
var cp = require('child_process');
//log4js.configure({
//	appenders: {
//		cons: { type: 'console' },
//		server: { type: 'file', filename: 'C:\\Users\\stric\\Desktop\\server.log' }
//	},
//	categories: {
//		default: { appenders: ['cons', 'server'], level: 'debug' }
//	}

//});
var logger = log4js.getLogger()

app.use(morgan({ "format": "default", "stream": { write: function (str) { logger.debug(str); } } }));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());

var cors = require('cors')
app.use(cors()) 
app.options('*', cors())

app.listen(1967, () => {
	logger.info('Server started!');
});
var tried = 0
var globalVolume = ''
var globalDoorbellVolume = ''
var hostname = execSync('hostname').toString()
hostname = hostname.substring(0,hostname.length - 2)
var checkVolume = function () {
	logger.debug('initial volume', globalVolume, globalDoorbellVolume)
        try {
                parseInt(globalVolume)
		
        } catch {
		logger.debug('setting to default 50')
                globalVolume = '50'
        }
	try {
		parseInt(globalDoorbellVolume)
	} catch {
		logger.debug('setting doorbell to default 50')
		globalDoorbellVolume = '50'
	}
}
var getVolumes = function(volName) {
	console.log(volName)
	var volOptions = {
	  hostname: '192.168.0.197',
	  port: 1966,
	  path: '/api/' + volName + '/' + hostname,
	  method: 'GET'
	}
	console.log(volOptions)
	var req = http.request(volOptions, res => {
	        logger.debug(`statusCode: ${res.statusCode}`)
	  res.on('data', d => {
            if (volName == 'rpiVolume') globalVolume += d
	    if (volName == 'rpiDoorbellVolume') globalDoorbellVolume += d 
	  })
	  res.on('end', function() {
	  	checkVolume()
	  })
	})
	
	req.on('error', function (err) {
	  if (tried > 10) {
		checkVolume()
	  } else {
	  	tried++
		logger.debug('error', err.message)
		setTimeout( getVolumes(volName),3000)
	  }
	})
	
	req.end()
}
getVolumes('rpiVolume')
getVolumes('rpiDoorbellVolume')


var queue = []

app.route('/api/queue/').get((req, res) => {
	//logger.debug('get queue')
	res.send(queue)
})
app.route('/api/volume/').get((req, res) => {
	logger.debug('get volume', globalVolume)
	res.send(globalVolume.toString())
})
app.route('/api/:action/').get((req, res) => {
	logger.debug('action' + req.params['action'])
	mplayerAction(req.params['action'])
	res.send('end')
});

app.route('/api/setvolume/:volume').get((req, res) => {
        logger.debug('setVolume' + req.params['volume'])
        mplayerAction('setvolume', req.params['volume'])
        res.send('end')
});

app.post('/api/play/', function(req,res){
	logger.debug('file post' + JSON.stringify(req.body))
        if (req.body && req.body.file){
            stopMplayer()
	        startMplayer(req.body.file)		
        }
        res.send('end')
})
app.post('/api/doorbell/', function(req,res){
        logger.debug('file post' + JSON.stringify(req.body))
        if (req.body && req.body.file){
	   var path = "//mnt/bigfucker/Music/Doorbell/" + req.body.file
	   if (!fs.existsSync(path)) {
		   logger.debug("file doesnt exist " + path)
		   path = "//mnt/bigfucker/Music/Doorbell/" + req.body.file
	   }
            stopMplayer()
		var actVolume = globalVolume
		globalVolume = globalDoorbellVolume
                startMplayer(path)
		globalVolume = actVolume

        }
        res.send('end')
})
app.post('/api/shuffle/', function(req,res){
        logger.debug('file post' + JSON.stringify(req.body))
        if (req.body && req.body.file){
            stopMplayer()
                startMplayerShuffle(req.body.file)
        }
        res.send('end')
})
app.post('/api/queue/', function(req,res){
	logger.debug('queue post' + JSON.stringify(req.body))
        if (req.body && req.body.file){
            queue.push(req.body.file)		
        }
        res.send('end')
})


var mplayerContainer

var saveVolume = function() {
	if (globalVolume > 100 ) {
                globalVolume = 100
        }
        var setVolOptions = {
			hostname: '192.168.0.197',
			port: 1966,
			path: '/api/rpiVolume/' + hostname + '/' + globalVolume,
			method: 'GET'
		  }
		  
		  var req = http.request(setVolOptions, res => {
			console.log(`statusCode: ${res.statusCode}`)	
		  })
		  
		  req.on('error', error => {
			console.error(error)
		  })
		  req.end()
}

var mplayerAction = function(action, additionalparam){
	if (!mplayerContainer){ 
		return
	}
	var actions = {
		'volumeup': '0',
		'volumedown': '9',
		'setvolume': function(){
			var i = 0
			while ( i<60) {
				setTimeout(mplayerAction,i*5,'volumedown')
				i+=1
			}
			i=0
			var ret = '';
			while (i < additionalparam / 3) {
				setTimeout(mplayerAction,300+i*5, 'volumeup')
				i+=1
			}
			globalVolume = additionalparam
		},
		'skip': '\n',
		'stop': stopMplayer,
		'pause': 'p',
		'resume': 'p',
		'clearqueue': function(){
			queue = []
		},
		'backward':  '\u001b[B',
                'ff':  '\u001b[A',
                '10xff': '\u001b[5~'		
	}
	if (action == 'volumeup') {
		globalVolume +=3
	} else if (action == 'volumedown') {
		globalVolume -=3
		if(globalVolume < 0) {
			globalVolume = 0
		}
	}
	saveVolume()
	if (!actions[action]) {
		logger.info(action + ' not supported');
		return
	}
	if (typeof actions[action] == 'function'){
		logger.info('performing function')
		actions[action]()
		return
	}
	console.log(additionalparam)
	if(actions[action] == 'p' && additionalparam == false) {
		console.log('before ', playing)
		playing = !playing
		console.log('after ', playing)
	}
	logger.info('writing' + actions[action])
	mplayerContainer.stdin.write(actions[action])
	        logger.info(action)
        if (action == '1u0xff') {
                var i = 0
                while ( i<9 ) {
                        logger.info(i)
                        mplayerContainer.stdin.write(actions[action])
                        i+=1
                }
        }

	return 'finished'
}


var startMplayer = function(file, additionalParams){
	var mplayerArgs = [];
	if (additionalParams){
		mplayerArgs.push(additionalParams)
	}
	mplayerArgs.push('-softvol')
	mplayerArgs.push('-quiet')
	mplayerArgs.push('-really-quiet')
        mplayerArgs.push('-cache')
        mplayerArgs.push('200')
	mplayerArgs.push('-volume')
	mplayerArgs.push(globalVolume)
	mplayerArgs.push('-novideo')

	if (file.substring(file.length - 3) == 'm3u') {
        	mplayerArgs.push('-playlist')
	}
	mplayerArgs.push('\\\\192.168.0.190\\big\\Music' + file.substring(21).replace(/\//g, "\\"))
	console.log(mplayerArgs)
	mplayerContainer = cp.spawn('C:\\Users\\stric\\Desktop\\mplayer-svn-38117\\mplayer.exe', mplayerArgs);
	
	mplayerContainer.stdout.setEncoding('utf8')
	mplayerContainer.on('exit', mplayerExit)
	mplayerContainer.on('err', mplayerError)
	playing = true;
}
var startMplayerShuffle = function(file){
	return startMplayer(file, '-shuffle')
}

var mplayerExit = function(){
	playing = false
	logger.info("mplayer exited")
	saveVolume()
	if ( queue.length > 0) {
		startMplayer(queue[0])
		queue.splice(0,1)
	}
}
var mplayerError = function(err){
	playing = false
	logger.info("mplayer error", err)
	mplayerContainer = ''
}

var stopMplayer = function(){
	if (mplayerContainer){
		mplayerContainer.kill()
	}
	queue = []
}



