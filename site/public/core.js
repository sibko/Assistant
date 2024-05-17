var deviceControl = angular.module('deviceControl', ['ngTouch', 'ngAnimate', 'ui.bootstrap', 'ngPrettyJson']);
deviceControl.filter('musicFilter', function(){
	return function(input, mfilter){
		var out = [];
		var words = mfilter.split(" ")
		angular.forEach(input, function(name){
			var ret = true
			angular.forEach(words, function(word){
				if(name.toLowerCase().indexOf(word.toLowerCase()) < 0){
					ret = false
				}
			})
			if (ret == true) {
				out.push(name)
			}
		})
		return out;
	}
})
deviceControl.controller("MainController", ['$scope', '$http', '$uibModal', '$rootScope', function ($scope, $http, $uibModal, $rootScope) {
	$scope.formData = {};
	$http.get('/api/devices')
		.then(function (data) {
			$scope.devices = data.data;
			$scope.catLocations = {"henry": "Unknown", "eddie": "Unknown", "elwood": "Unknown"}
			$scope.locations = ['Top', 'Groups', 'All', 'Computers']
			console.log($scope.devices)
			$scope.devices.forEach(function (device) {
				if (!$scope.locations.includes(device.location) && !device.hidden) {
					$scope.locations.push(device.location)
				}
				if (device.groupFunctions) {
					device.groupFunctions.forEach(function (gfunc) {
						if (gfunc != "") {
							var index = device.functions.indexOf(gfunc)
							device.functions.splice(index, 1)
						}
					})
				}
			})
			$scope.locations.push('Motions')
			$scope.locations.push('Timers')
			$scope.locations.push('Admin')
			console.log("Received devices", data);
			$http.get('/api/catLocations')
		.then(function (data) {
			$scope.catLocations = data.data			
			console.log('Received Cats', $scope.catLocations)					
		}, function (error) {
			console.log('Error: ' + error);
		});
		}, function (error) {
			console.log('Error: ' + error);
		});
		$http.get('/api/groups')
		.then(function (data) {
			$scope.groups = data.data;			
			console.log('Received Groups', $scope.groups)					
		}, function (error) {
			console.log('Error: ' + error);
		});
	$scope.getPopList = function () {
		$http.get('/api/poplist')
			.then(function (data) {
				$scope.poplist = []
				var tmppoplist = []
				for (var dev in data.data) {
					tmppoplist.push([dev, data.data[dev]])
				}
				tmppoplist.sort(function (a, b) {
					return b[1] - a[1]
				})

				tmppoplist.splice(9)
				tmppoplist.forEach(function (a) {
					$scope.poplist.push(a[0])
				})
			}, function (error) {
				console.log('Error: ' + error);
			});
	}
	$rootScope.performAction = function (device, action) {
		$http.get('/api/device/' + device.name + '/' + action)
			.then(function (data) {
				console.log("action complete", data);
				$scope.getPopList()
			}, function (error) {
				console.log('Error: ' + error);
			});
	}
	$rootScope.performGroupAction = function (group) {
		$http.get('/api/groups/' + group.name)
			.then(function (data) {
				console.log("action complete", data);
				$scope.getPopList()
				$scope.getTimers()
			}, function (error) {
				console.log('Error: ' + error);
			});
	}

	$scope.openDeviceModal = function (device) {
		if (device.type == 'CatLaser') {
			return $scope.openCatLaserModal(device);
		}
		$scope.modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'deviceModal.html',
			controller: 'DeviceHandlerController',
			controllerAs: '$ctrl',
			size: 'lg',
			resolve: {
				device: function () {
					return device
				}
			}
		}).closed.then(function () {
			$scope.getTimers()
		});

	}
	$scope.openMotionModal = function (id, motion) {
                $scope.modalInstance = $uibModal.open({
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        templateUrl: 'motionModal.html',
                        controller: 'MotionHandlerController',
                        controllerAs: '$ctrl',
                        size: 'lg',
                        resolve: {
                                id: function () {
                                        return id
                                },
				motion: function() {
					return motion
				},
				devices: function() {
					return $scope.devices
				}
                        }
                }).closed.then(function () {
                        $scope.getTimers()
			$scope.getMotions()
                });

        }
	$scope.restartServer = function () {
		 $http.get('/api/restartServer')
                        .then(function (data) {
                                console.log("action complete", data);
                                $scope.getPopList()
                                $scope.getTimers()
                        }, function (error) {
                                console.log('Error: ' + error);
                        });

        }

	$scope.updatePis = function () {
                 $http.get('/api/updatePis')
                        .then(function (data) {
                                console.log("action complete", data);
                        }, function (error) {
                                console.log('Error: ' + error);
                        });

        }

	$scope.openConfigModal = function () {
		$scope.modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        templateUrl: 'configModal.html',
                        controller: 'ConfigHandlerController',
                        controllerAs: '$ctrl',
                        size: 'lg',
                        resolve: {
                        }
                }).closed.then(function () {
                        $scope.getTimers()
                });

	}
	$scope.openFreePlugsModal = function () {
                $scope.modalInstance = $uibModal.open({
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        templateUrl: 'freePlugsModal.html',
                        controller: 'freePlugsHandlerController',
                        controllerAs: '$ctrl',
                        size: 'lg',
                        resolve: {
                        }
                }).closed.then(function () {
                        $scope.getTimers()
                });
        }

	$scope.openCatLaserModal = function (device) {
		$scope.modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'CatLaserModal.html',
			controller: 'CatLaserController',
			controllerAs: '$ctrl',
			size: 'lg',
			resolve: {
				device: function () {
					return device
				}
			}
		});

	}

	$scope.getTimers = function () {
		$http.get('/api/timers/')
			.then(function (data) {
				console.log("TIMERS", data);
				$scope.timers = data.data
				$scope.timers.forEach(function(timer){
					if(timer.triggerAt) timer.date = new Date(timer.triggerAt)
					if (timer.days && timer.days != ""){
						timer.niceDays = ""
						timer.days.split(",").forEach(function(day){
                        				if (day == 1) timer.niceDays += "Mon/"
			                                if (day == 2) timer.niceDays += "Tue/"
			                                if (day == 3) timer.niceDays += "Wed/"
			                                if (day == 4) timer.niceDays += "Thu/"
			                                if (day == 5) timer.niceDays += "Fri/"
			                                if (day == 6) timer.niceDays += "Sat/"
			                                if (day == 7) timer.niceDays += "Sun/"
                        			})
					}
					if (timer.timePreset && timer.timePreset == "none") {
						var today= new Date()
		                                today.setMinutes(0)
		                                today.setHours(0)
		                                today.setSeconds(0)
		                                var todaystime = new Date(today.getTime() + timer.time)
		                                timer.niceTime= todaystime.getHours() + ":" + todaystime.getMinutes()
					}
				})

			})
	}
	$scope.motions = {}
	$scope.getMotions = function () {
                $http.get('/api/motion/')
                        .then(function (data) {
                                console.log("motions", data);
				$scope.motions = data.data;
			})
	}

	$scope.deleteTimer = function (timer) {
		$http.get('/api/timers/' + timer.id)
			.then(function (data) {
				console.log(data)
				$scope.getTimers()
			})
	}
	$scope.sortbylocation = function (item) {
		if (item == 'Top' || item == 'Groups') {
			return -1;
		}
		if (item == 'Motions') return +100
		return item;
	}
	$scope.getPopList()
	$scope.getTimers()
	$scope.getMotions()
}])



deviceControl.controller("mediaController", ['$scope', '$http', '$uibModal', '$rootScope', function ($scope, $http, $uibModal, $rootScope) {
	$scope.formData = {};
	$scope.device = {}
	$http.get('/api/devices')
		.then(function (data) {
			$scope.devices = data.data;
			$scope.pis = []
			console.log($scope.devices)
			$scope.devices.forEach(function (device) {
				var exists = false
				$scope.pis.forEach(function(pi){
					if (pi.name == device.name) exists=true
				})
				if (!exists && !device.hidden && device.type == 'rPI' && device.name != 'Microserver') {
					$scope.pis.push(device)
				}
			})
			$scope.selectPi($scope.pis[0])
			console.log($scope.pis)
		})
		
	
	$rootScope.performAction = function (device, action) {
		$http.get('/api/device/' + device.name + '/' + action)
			.then(function (data) {
				console.log("action complete", data);
			}, function (error) {
				console.log('Error: ' + error);
			});
	}

	$scope.openDeviceModal = function (device) {
		$scope.modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'deviceModal.html',
			controller: 'DeviceHandlerController',
			controllerAs: '$ctrl',
			size: 'lg',
			resolve: {
				device: function () {
					return device
				}
			}
		})

	}
	$scope.selectPi = function(pi) {
		$scope.device = pi
		$scope.getVolume()
		$scope.online = 'unknown'
		$http.get('/api/device/' + $scope.device.name + '/ping/')
	        .then(function (data) {
	                console.log("PING",data)
			var packetLoss = data.data.split('%')[0].split('received, ')[1]
	                if (packetLoss && packetLoss == '100') {
				$scope.online = 'false'
			} else {
				$scope.online = 'true'
			}

	        }, function (error) {
	                console.log('Error: ' + JSON.stringify(error));
	        });

	        $scope.serverStatus = 'unknown'
	
	        $http.get('http://' + $scope.device.ip + ':1967/api/queue').then(function (data) {
        	        $scope.serverStatus = 'online'
	        }).catch(function (e) {
			console.log(e)
	                $scope.serverStatus = 'offline'
	        })


	}
	$scope.actions = ['Volume Up','Pause','Volume Down','Skip','Set Volume','Stop','Backward','FF', '10x FF', 'Get Music', '2 Hours', 'Clear Queue']
	$scope.lines = [1,2,3,4]
	$scope.closeModal = function () {
		$uibModalInstance.close();
	}
	var volumeTimeout = ''
	$scope.setVolume = 50
	$scope.queue = []
	if ($rootScope.queueInterval) clearInterval($rootScope.queueInterval)
	$rootScope.queueInterval = setInterval(function() {$scope.getQueue()}, 5000)
	$scope.getQueue = function() {
		if (!$scope.device.ip) return
		$http.get('http://' + $scope.device.ip + ':1967/api/queue').then(function (data) {
			console.log('got queue', data.data)
			$scope.queue = data.data
		})
	}

	$scope.mediaAction = function (action, parameter) {
		console.log(action, parameter, $scope.device)
		if (action == 'Set Volume' && parameter){			
			clearTimeout(volumeTimeout)
			volumeTimeout = setTimeout(function(){
				$http.get('http://' + $scope.device.ip + ':1967/api/setvolume/' + parameter).then(function(response){
					$scope.getVolume()
				})
			},500)
			
		} else if (action=='Get Music') {
			var url = '/api/getMusic/'
			if (parameter == 'force'){
				console.log('force')
                                url = '/api/forceGetMusic'
                        }
			$http.get(url).then(function (data) {
				console.log('got Music')
                                $scope.musicDir = data.data
                        }, function (error) {
                                console.log('Error: ' + error);
                        });
		} else if (action == '2 Hours') {
			var url = '/api/stopIn2Hours/'

	        	$http.post('/api/stopIn2Hours/', { url: 'http://' + $scope.device.ip + ':1967/api/stop/' }).then(function(data) {
				console.log("RECEIVED RESPONSE:", data)
		        })
		}  else {
			$http.get('http://' + $scope.device.ip + ':1967/api/'+ action.replace(' ', '').toLowerCase() + '/').then(function(response){
					console.log(response)
					if (action.toLowerCase().indexOf("volume") >= 0) $scope.getVolume()
				})
		}
		$scope.getQueue()
	}
	if (!$scope.musicDir || $scope.musicDir.length == 0) {
		$scope.mediaAction('Get Music')
	}
	$scope.playMusic = function(file) {
		console.log($scope.device)
		$http.post('http://' + $scope.device.ip + ':1967/api/play/', {'file':file}).then(function(data) {
			console.log(data)
		}, function (error) {
			console.log('Error: ' + error);
		})
	}
	$scope.shuffleMusic = function(file) {
                $http.post('http://' + $scope.device.ip + ':1967/api/shuffle/', {'file':file}).then(function(data) {
                        console.log(data)
                }, function (error) {
                        console.log('Error: ' + error);
                })
        }
	$scope.queueMusic = function(file) {
		if (!$scope.device.ip) return
		$http.post('http://' + $scope.device.ip + ':1967/api/queue/', {'file':file}).then(function(data) {
			console.log(data)
			$scope.queue.push(file)
		}, function (error) {
			console.log('Error: ' + error);
		})
	}
	$scope.getVolume = function() {
		if (!$scope.device.ip) return
		$http.get('http://' + $scope.device.ip + ':1967/api/volume').then(function (data) {
			console.log('got volume "' + data.data +'"')
			$scope.setVolume = parseInt(data.data)
		})
	}
	$scope.getQueue = function() {
		if (!$scope.device.ip) return
		$http.get('http://' + $scope.device.ip + ':1967/api/queue').then(function (data) {
			console.log('got queue', data.data)
			$scope.queue = data.data
		})
	}
	$scope.online = 'unknown'
	$scope.serverStatus = 'unknown'
	
	$scope.getVolume()
	$scope.getQueue()

}])

deviceControl.controller("freePlugsHandlerController", function ($scope, $http, $uibModal, $uibModalInstance, $rootScope) {
        var url = '/api/getFreePlugs/false'
        $http.get(url).then(function (data) {
                console.log('got free plugs', data.data)
                $scope.freePlugs = data.data
        }, function (error) {
                console.log('Error: ' + error);
        });
	$scope.showHidden = false;
	$scope.includeHidden = function () {
		$scope.showHidden = !$scope.showHidden
		url = '/api/getFreePlugs/' + $scope.showHidden
		$http.get(url).then(function (data) {
                	console.log('got free plugs', data.data)
        	        $scope.freePlugs = data.data
	        }, function (error) {
                	console.log('Error: ' + error);
        	});
	}
	$scope.closeModal = function () {
                $uibModalInstance.close();
        }
})

deviceControl.controller("ConfigHandlerController", function ($scope, $http, $uibModal, $uibModalInstance, $rootScope) {
	var url = '/api/getConfig/'
        $http.get(url).then(function (data) {
        	console.log('got config', data.data)
        	$scope.config = data.data
        }, function (error) {
                console.log('Error: ' + error);
        });
	$scope.saveConfig = function(newconfig) {
		$http.post('/api/updateConfig/', JSON.stringify(newconfig)).then(function(data) {
			console.log("RECEIVED RESPONSE:", data)
		})
	}
	$scope.closeModal = function () {
                $uibModalInstance.close();
        }
})

deviceControl.controller("MotionHandlerController", function ($scope, $http, $uibModal, $uibModalInstance, id, motion,devices, $rootScope) {
        console.log("modal", id, motion, devices)
        console.log($rootScope)
        $scope.id = id
	var origLastDetection = motion.lastDetection
	$scope.motion = motion
	$scope.motion.actionsOnFirstTrigger = $scope.motion.actionsOnFirstTrigger  || []
	$scope.motion.actionsOnEachTrigger = $scope.motion.actionsOnEachTrigger  || []
	$scope.motion.timeout = $scope.motion.timeout || 0
	$scope.motion.processed = $scope.motion.processed || false
	$scope.motion.actionsOnTimeout = $scope.motion.actionsOnTimeout || []
	$scope.motion.lastDetection = new Date($scope.motion.lastDetection)
	$scope.motion.repeat = $scope.motion.repeat || 3
	$scope.motion.fromPreset = $scope.motion.fromPreset || "custom"
	$scope.motion.toPreset = $scope.motion.toPreset || "custom"
	$scope.devices = {}
	devices.forEach(function(device){
		if (device.name && device.functions){
			$scope.devices[device.name] = device.functions
		}
	})
	console.log("NEW DEVICES", $scope.devices)
	$scope.addFirstTriggerAction = function() {
		$scope.motion.actionsOnFirstTrigger.push({})
		console.log($scope.motion)
	}
	$scope.addTimeoutAction = function() {
                $scope.motion.actionsOnTimeout.push({})
                console.log($scope.motion)
        }
	$scope.addEachTriggerAction = function() {
                $scope.motion.actionsOnEachTrigger.push({})
                console.log($scope.motion)
        }
	$scope.deleteEachTriggerAction = function(name) {
		$scope.motion.actionsOnEachTrigger.forEach(function(action, index){
			if (action.device == name) $scope.motion.actionsOnEachTrigger.splice(index,1)
		})
        }
	$scope.deleteTimeoutAction = function(name) {
                $scope.motion.actionsOnTimeout.forEach(function(action, index){
                        if (action.device == name) $scope.motion.actionsOnTimeout.splice(index,1)
                })
        }
	$scope.deleteFirstTriggerAction = function(name) {
                $scope.motion.actionsOnFirstTrigger.forEach(function(action, index){
                        if (action.device == name) $scope.motion.actionsOnFirstTrigger.splice(index,1)
                })
        }
	$scope.submitMotion = function() {
		$scope.motion.lastDetection = origLastDetection
		$http.post('/api/updateMotion/', {id: $scope.id, obj: $scope.motion}).then(function(data) {
                        console.log(data)
                }, function (error) {
                        console.log('Error: ' + error);
                })
	}
	$scope.closeModal = function () {
                $uibModalInstance.close();
        }

})

deviceControl.controller("DeviceHandlerController", function ($scope, $http, $uibModal, $uibModalInstance, device, $rootScope) {
	console.log("modal", device)
	console.log($rootScope)
	$scope.device = device
	$scope.lines = []
	if (device.groupFunctions) {
		for (var i = 0; i < Math.ceil(device.groupFunctions.length / 3); i++) {
			$scope.lines.push(i + 1)
		}
	}
	$scope.openTimerModal = function (device, func) {
		$scope.modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'timerModal.html',
			controller: 'TimerHandlerController',
			controllerAs: '$ctrl',
			size: 'lg',
			resolve: {
				device: function () {
					return device
				},
				func: function () {
					return func
				}
			}
		})
	}

	$scope.openMediaModal = function (device, func) {
		$scope.modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'mediaModal.html',
			controller: 'MediaHandlerController',
			controllerAs: '$ctrl',
			size: 'lg',
			resolve: {
				device: function () {
					return device
				},
				func: function () {
					return func
				}
			}
		})
	}

	$scope.getAssLogs = function (device) {
		$http.get('/api/device/' + device.name + '/Logs/')
			.then(function (data) {
				console.log(data)
				$scope.logs = data.data
			}, function (error) {
				console.log('Error: ' + error);
			});
	}
	$scope.pingDevice = function (device) {
		$http.get('/api/device/' + device.name + '/ping/')
			.then(function (data) {
				console.log(data)
				$scope.status = data.data
			}, function (error) {
				console.log('Error: ' + error);
			});
	}

	$scope.closeModal = function () {
		$uibModalInstance.close();
	}

});

deviceControl.controller("TimerHandlerController", function ($scope, $http, $uibModalInstance, device, func) {
	console.log("timermodal", device, func)
	$scope.device = device
	$scope.func = func
	console.log(device, func)
	$scope.minutes = 0;
	$scope.time = {preset:"none"}
	$scope.days = {preset:"custom"}
	$scope.createTimer = function (device, action) {
		$http.get('/api/device/' + device.name + '/' + action + '/' + $scope.minutes)
			.then(function (data) {
				console.log("action complete", data);
			}, function (error) {
				console.log('Error: ' + error);
			});
	}
	$scope.createDailyTimer = function (device, action, days, time) {
		$http.post('/api/dailyTimer/', JSON.stringify({device: device, action: action, days: days, time: time})).then(function(data) {
                        console.log(data)
                }, function (error) {
                        console.log('Error: ' + error);
                })
        }
	$scope.closeModal = function () {
		$uibModalInstance.close();
	}
	$scope.submitTimer = function (device, action) {
                console.log($scope.time, $scope.days, device, action)
		
		$http.post('/api/createTimer/', JSON.stringify({device: device, action: action, days: $scope.days, time:$scope.time, minutes: $scope.minutes})).then(function(data) {
                        console.log(data)
                }, function (error) {
                        console.log('Error: ' + error);
                })
        }

});

deviceControl.controller("MediaHandlerController", function ($scope, $http, $uibModalInstance, device, func, $rootScope) {
	console.log("mediamodal", device, func)
	$scope.device = device
	$scope.func = func
	$scope.actions = ['Volume Up','Pause','Volume Down','Skip','Set Volume','Stop','Get Music', '2 Hours', 'Clear Queue']
	console.log(device, func)
	$scope.lines = [1,2,3]
	$scope.closeModal = function () {
		$uibModalInstance.close();
	}
	var volumeTimeout = ''
	$scope.setVolume = 50
	$scope.queue = []
	if ($rootScope.queueInterval) clearInterval($rootScope.queueInterval)
	$rootScope.queueInterval = setInterval(function() {$scope.getQueue()}, 5000)
	$scope.getQueue = function() {
		$http.get('http://' + device.ip + ':1967/api/queue').then(function (data) {
			console.log('got queue', data.data)
			$scope.queue = data.data
		})
	}

	$scope.mediaAction = function (action, parameter) {
		console.log(action, parameter, device)
		if (action == 'Set Volume' && parameter){			
			clearTimeout(volumeTimeout)
			volumeTimeout = setTimeout(function(){
				$http.get('http://' + device.ip + ':1967/api/setvolume/' + parameter).then(function(response){
					$scope.getVolume()
				})
			},500)
			
		} else if (action=='Get Music') {
			var url = '/api/getMusic/'
			if (parameter == 'force'){
				console.log('force')
                                url = '/api/forceGetMusic'
                        }
			$http.get(url).then(function (data) {
				console.log('got Music')
                                $scope.musicDir = data.data
                        }, function (error) {
                                console.log('Error: ' + error);
                        });
		} else if (action == '2 Hours') {
			var url = '/api/stopIn2Hours/'

	        	$http.post('/api/stopIn2Hours/', { url: 'http://' + device.ip + ':1967/api/stop/' }).then(function(data) {
				console.log("RECEIVED RESPONSE:", data)
		        })
		}  else {
			$http.get('http://' + device.ip + ':1967/api/'+ action.replace(' ', '').toLowerCase() + '/').then(function(response){
					console.log(response)
					if (action.toLowerCase().indexOf("volume") >= 0) $scope.getVolume()
				})
		}
		$scope.getQueue()
	}
	if (!$scope.musicDir || $scope.musicDir.length == 0) {
		$scope.mediaAction('Get Music')
	}
	$scope.playMusic = function(file) {
		$http.post('http://' + device.ip + ':1967/api/play/', {'file':file}).then(function(data) {
			console.log(data)
		}, function (error) {
			console.log('Error: ' + error);
		})
	}
	$scope.shuffleMusic = function(file) {
                $http.post('http://' + device.ip + ':1967/api/shuffle/', {'file':file}).then(function(data) {
                        console.log(data)
                }, function (error) {
                        console.log('Error: ' + error);
                })
        }
	$scope.queueMusic = function(file) {
		$http.post('http://' + device.ip + ':1967/api/queue/', {'file':file}).then(function(data) {
			console.log(data)
			$scope.queue.push(file)
		}, function (error) {
			console.log('Error: ' + error);
		})
	}
	$scope.getVolume = function() {
		$http.get('http://' + device.ip + ':1967/api/volume').then(function (data) {
			console.log('got volume "' + data.data +'"')
			$scope.setVolume = parseInt(data.data)
		})
	}
	$scope.getQueue = function() {
		$http.get('http://' + device.ip + ':1967/api/queue').then(function (data) {
			console.log('got queue', data.data)
			$scope.queue = data.data
		})
	}
	$scope.getVolume()
	$scope.getQueue()
});

deviceControl.controller("CatLaserController", function ($scope, $http, $uibModal, $uibModalInstance, device) {
	console.log("modal", device)
	$scope.device = device
	$scope.xaxis = 0;
	$scope.yaxis = 0;
	var prevxaxis = 0;
	var prevyaxis = 0;
	var inprogress = false;
	var movement = setInterval(function () {
		console.log("interval")
		if ($scope.xaxis != prevxaxis && $scope.yaxis != prevyaxis && inprogress == false) {
			prevxaxis = $scope.xaxis;
			prevyaxis = $scope.yaxis;
			inprogress = true;
			$http.get('http://' + device.ids[0] + '/?horz=' + (180 - $scope.xaxis) + '&vert=' + (180 - $scope.yaxis))
				.then(function (data) {
					inprogress = false;
					console.log("action complete", data);
				}, function (error) {
					inprogress = false;
					console.log('Error: ' + error);
				});
		}
	}, 300)
	$scope.setValue = function (key, value) {
		$http.get('http://' + device.ids[0] + '/?' + key + '=' + value)
			.then(function (data) {
				console.log("action complete", data);
			}, function (error) {
				console.log('Error: ' + error);
			});
	}

	$scope.closeModal = function () {
		clearInterval(movement);
		$uibModalInstance.close();
	}

});
