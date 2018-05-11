var deviceControl = angular.module('deviceControl', []);
function mainController($scope, $http) {
	$scope.formData = {};
	$http.get('/api/devices')
		.success(function(data){
			$scope.devices = data;
			$scope.locations = ['All']
			$scope.devices.forEach(function(device){
				if (!$scope.locations.includes(device.location)) {
					$scope.locations.push(device.location)
				}
			})
			console.log("Received devices", data);
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});
}
