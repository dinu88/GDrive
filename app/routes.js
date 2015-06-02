
GDrive.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$locationProvider',
  function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {
    "use strict";
    //$locationProvider.html5Mode(true);
    console.log('routes');

    $stateProvider.state('signIn', {
      url: '/sign-in',
      title: 'GDrive - authenticate',
      views: {
        'content@': {
          templateUrl: 'partials/sign-in.html',
          controller: 'signIn'
        }
      }
    });
    //$urlRouterProvider.otherwise('/');
  }]);