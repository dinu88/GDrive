var GDriveControllers = angular.module('GDriveControllers', []);

GDriveControllers.controller('signIn', ['$scope', function($scope) {
  "use strict";
  console.log('signIn');
  $scope.url = Drive.authUrl;
  console.log($scope.url);
  Drive.on('ready', function() {
    $scope.url = Drive.authUrl;
    console.log(Drive.authurl);
  });
  $scope.submitKey = function() {
    Drive.auth($scope.key, function(error, user) {
      if (error) {
        console.log(error);
      } else {
        Drive.window.hide();
        Drive.sync();
      }
    });
  }
}]);