const express = require('express');
const log4js = require('log4js')
const app = express();
const fs = require('fs')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const exec = require('child_process').exec;
const http = require('http');
const querystring = require('querystring');
const q = require("q");
var cp = require('child_process');
var zerorpc = require("zerorpc");
var playing = false;
var zserver = new zerorpc.Server({
    volume: function(direction, reply) {
		mplayerAction('volume' + direction.toString())
		reply(null,'zvolume' + direction)
	},
	setvolume: function(volume, reply) {
		mplayerAction('setvolume', volume.toString())
		reply(null,'zsetvolume ' + volume.toString())
	},
	skip: function(reply) {
		mplayerAction('skip')
		reply(null,'zskip')
	},
	pause: function(assistant, reply) {
		mplayerAction('pause', assistant)
		reply(null,"zpause")
	},
	resume: function(assistant, reply) {
		mplayerAction('pause', assistant)
		reply(null,"zresume")
	},
	stop: function(reply) {
		mplayerAction('stop')
		reply(null,"zstop")
	},
	play: function(mfile, reply) {
		stopMplayer()
		startMplayer(mfile.toString())
		reply(null, "zplay")
	},
	shuffle: function(mfile, reply) {
		stopMplayer()
		startMplayerShuffle(mfile.toString())
		reply(null, "zplay")
	},
	isalive: function(reply) {
		reply(null, playing)
	}
});

zserver.bind("tcp://0.0.0.0:4242");

var volumefile = '/home/pi/mplayervolume'
var globalVolume = fs.readFileSync(volumefile, 'utf8').replace('\n', '')
var queue = []

log4js.configure({
	appenders: {
		cons: { type: 'console' },
		server: { type: 'file', filename: 'server.log' }
	},
	categories: {
		default: { appenders: ['cons', 'server'], level: 'debug' }
	}

});
var logger = log4js.getLogger()

app.use(morgan({ "format": "default", "stream": { write: function (str) { logger.debug(str); } } }));
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(function(req,res,next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
})
app.listen(1967, () => {
	logger.info('Server started!');
});

app.route('/api/queue/').get((req, res) => {
	logger.debug('get queue')
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
        fs.writeFileSync(volumefile, globalVolume, 'utf8')
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
		}
		
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
	return 'finished'
}


var startMplayer = function(file, additionalParams){
	var mplayerArgs = [];
	if (additionalParams){
		mplayerArgs.push(additionalParams)
	}
	mplayerArgs.push('-quiet')
	mplayerArgs.push('-really-quiet')
	mplayerArgs.push('-volume')
	mplayerArgs.push(globalVolume)


	if (file.substring(file.length - 3) == 'm3u') {
        mplayerArgs.push('-playlist')
    }
	mplayerArgs.push(file)
	console.log(mplayerArgs)
	mplayerContainer = cp.spawn('mplayer', mplayerArgs);
	
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
}

