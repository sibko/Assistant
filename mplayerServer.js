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
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.listen(1967, () => {
	logger.info('Server started!');
});

var config = fs.readFileSync('config.json', 'utf8')
config = JSON.parse(config)

app.route('/api/:action/').get((req, res) => {
	logger.debug('action' + req.params['action'])
	mplayerAction(req.params['action'])
});
app.route('/api/play/:file').get((req, res) => {
	logger.debug('file' + req.params['file'])
	stopMplayer()
	startMplayer('file', req.params['file'])
});
app.route('/api/playlist/:file').get((req, res) => {
	logger.debug('playlist' + req.params['file'])
	stopMplayer()
	startMplayer('playlist', req.params['file'])
});

var mplayerContainer

var mplayerAction = function(action){
	if (!mplayerContainer){ 
		return
	}
	var actions = {
		'volumeup': '0',
		'volumedown': '9',
		'setvolume': function(volume){
			while (i<15){
				i+=1
				mplayerContainer.stdin.write('9999')
			}
			i=0
			var ret = '';
			while (i < volume) {
				i+=3
				mplayerContainer.stdin.write('0')
			}			
		},
		'skip': '\n',
		'stop': function(){stopMplayer()},
		'pause': 'p',
		'resume': 'p'
	}
	if (!actions[action]) {
		logger.info(action + ' not supported');
		return
	}
	if (typeof actions[action] == 'function'){
		logger.info('performing function')
		actions[action]
		return
	}
	logger.info('writing' + actions[action])
	mplayerContainer.stdin.write(actions[action])
}


var startMplayer = function(type, file, additionalParams){
	var cp = require('child_process');
	var mplayerArgs = [];
	if (type == 'playlist') {
	        mplayerArgs.push('-playlist')
	}
	if (additionalParams){
		mplayerArgs.push(additionalParams)
	}
	mplayerArgs.push(file)
	mplayerContainer = cp.spawn('mplayer', mplayerArgs);
	
	mplayerContainer.stdout.setEncoding('utf8')
	mplayerContainer.on('exit', console.log.bind(console,('FIN')))
}

var stopMplayer = function(){
	if (mplayerContainer){
		mplayerContainer.kill()
	}	
}

