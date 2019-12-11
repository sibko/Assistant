var deviceControl = angular.module('deviceControl', ['ngTouch', 'ngAnimate', 'ui.bootstrap']);
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
			$scope.locations = ['Top', 'Groups', 'All', 'Computers']
			console.log($scope.devices)
			$scope.devices.forEach(function (device) {
				if (!$scope.locations.includes(device.location)) {
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
			$scope.locations.push('Timers')
			console.log("Received devices", data);
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

				tmppoplist.splice(7)
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
		return item;
	}
	$scope.getPopList()
	$scope.getTimers()
}])

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
	$scope.createTimer = function (device, action) {
		$http.get('/api/device/' + device.name + '/' + action + '/' + $scope.minutes)
			.then(function (data) {
				console.log("action complete", data);
			}, function (error) {
				console.log('Error: ' + error);
			});
	}

	$scope.closeModal = function () {
		$uibModalInstance.close();
	}

});

deviceControl.controller("MediaHandlerController", function ($scope, $http, $uibModalInstance, device, func) {
	console.log("mediamodal", device, func)
	$scope.device = device
	$scope.func = func
	$scope.actions = ['Volume Up','Pause','Volume Down','Skip','Set Volume','Stop','Get Music', '', 'Clear Queue']
	console.log(device, func)
	$scope.lines = [1,2,3]
	$scope.closeModal = function () {
		$uibModalInstance.close();
	}
	var volumeTimeout = ''
	$scope.setVolume = 50
	$scope.queue = []
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
					console.log(response)
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
		} else {
			$http.get('http://' + device.ip + ':1967/api/'+ action.replace(' ', '').toLowerCase() + '/').then(function(response){
					console.log(response)
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
