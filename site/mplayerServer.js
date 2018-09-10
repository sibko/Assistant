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
		if (req.body.file.substring(req.body.file.length - 3) == 'm3u'){
	                startMplayer('playlist', req.body.file)
		} else {
	                startMplayer('file', req.body.file)
		}
        }
        res.send('end')
})

var mplayerContainer

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
		},
		'skip': '\n',
		'stop': stopMplayer,
		'pause': 'p',
		'resume': 'p'
	}
	if (!actions[action]) {
		logger.info(action + ' not supported');
		return
	}
	if (typeof actions[action] == 'function'){
		logger.info('performing function')
		actions[action]()
		return
	}
	logger.info('writing' + actions[action])
	mplayerContainer.stdin.write(actions[action])
	return 'finished'
}


var startMplayer = function(type, file, additionalParams){
	var cp = require('child_process');
	var mplayerArgs = [];
	if (additionalParams){
		mplayerArgs.push(additionalParams)
	}
	mplayerArgs.push('-quiet')
	mplayerArgs.push('-really-quiet')

	if (type == 'playlist') {
                mplayerArgs.push('-playlist')
        }
	mplayerArgs.push(file)
	mplayerContainer = cp.spawn('mplayer', mplayerArgs);
	
	mplayerContainer.stdout.setEncoding('utf8')
	mplayerContainer.on('exit', mplayerExit)
	mplayerContainer.on('err', mplayerError)
}

var mplayerExit = function(){
	logger.info("mplayer exited")
	mplayerContainer = ''
}
var mplayerError = function(err){
	logger.info("mplayer error", err)
	mplayerContainer = ''
}

var stopMplayer = function(){
	if (mplayerContainer){
		mplayerContainer.kill()
		mplayerContainer = ''
	}	
}

