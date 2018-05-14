var deviceControl = angular.module('deviceControl', ['ngTouch', 'ngAnimate', 'ui.bootstrap']);
deviceControl.controller("MainController", ['$scope', '$http', '$uibModal', function ($scope, $http, $uibModal) {
	$scope.formData = {};
	$http.get('/api/devices')
		.then(function (data) {
			$scope.devices = data.data;
			$scope.locations = ['All']
			console.log($scope.devices)
			$scope.devices.forEach(function (device) {
				if (!$scope.locations.includes(device.location)) {
					$scope.locations.push(device.location)
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
		$scope.modalInstance = $uibModal.open({
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'modalwindow.html',
			controller: 'ModalHandlerController',
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

deviceControl.controller("ModalHandlerController", function ($scope, $http, $uibModalInstance, device) {
	console.log("modal", device)
	$scope.device = device

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