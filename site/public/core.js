var deviceControl = angular.module('deviceControl', ['ngTouch', 'ngAnimate', 'ui.bootstrap']);
deviceControl.controller("MainController", ['$scope', '$http', '$uibModal', function ($scope, $http, $uibModal) {
	$scope.formData = {};
	$http.get('/api/devices')
		.then(function (data) {
			$scope.devices = data.data;
			$scope.locations = ['All', 'Computers']
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
			console.log("Received devices", data);
		}, function (error) {
			console.log('Error: ' + error);
		});

	$scope.performAction = function (device, action) {
		$http.get('/api/device/' + device.name + '/' + action)
			.then(function (data) {
				console.log("action complete", data);
			}, function (error) {
				console.log('Error: ' + error);
			});
	}

	$scope.openDeviceModal = function (device) {
		console.log(device)
		if(device.type=='CatLaser'){
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
		});

	}

	$scope.openCatLaserModal = function (device) {
		console.log("catLaser")
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
}])

deviceControl.controller("DeviceHandlerController", function ($scope, $http, $uibModal, $uibModalInstance, device) {
	console.log("modal", device)
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
		});
	}

	$scope.performAction = function (device, action) {
		$http.get('/api/device/' + device.name + '/' + action)
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

deviceControl.controller("CatLaserController", function ($scope, $http, $uibModal, $uibModalInstance, device) {
	console.log("modal", device)
	$scope.device = device
	
	$scope.setValue = function (key, value) {
		$http.get('http://' + device.ids[0] + '/?' + key + '=' + value)
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