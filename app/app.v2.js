var GDrive = angular.module("GDrive", [
  "ui.router",
  "GDriveControllers",
  "ui.bootstrap"
]);

GDrive.run(['$rootScope', '$state', function($rootScope, $state) {
  "use strict";
  console.log('run');
  Drive.init();
  Drive.on('ready', function() {
    if (Drive.credentials) {
      console.log('drive is ready');
      Drive.window.hide();
      Drive.sync();
    } else {
      $state.go('signIn');
    }
  });
  $rootScope.$on("$stateChangeSuccess", function(currentRoute, previousRoute){
    //Change page title, based on Route information
    $rootScope.title = $state.current.title;
    $rootScope.state = $state.current.name;
  });
}]);

var Drive = new Drive();
