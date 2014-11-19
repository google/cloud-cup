"use strict";

angular.module('myApp.routes', ['ngRoute', 'simpleLogin'])

  .constant('ROUTES', {
    '/start': {
      templateUrl: 'partials/start.html',
      controller: 'StartCtrl'
    },
    '/game': {
      templateUrl: 'partials/game.html',
      controller: 'GameCtrl'
    },
  })

  // configure views; the authRequired parameter is used for specifying pages
  // which should only be available while logged in
  .config(['$routeProvider', 'ROUTES', function($routeProvider, ROUTES) {
    angular.forEach(ROUTES, function(route, path) {
      if( route.authRequired ) {
        // adds a {resolve: user: {...}} promise which is rejected if
        // the user is not authenticated or fulfills with the user object
        // on success (the user object is then available to dependency injection)
        $routeProvider.whenAuthenticated(path, route);
      }
      else {
        // all other routes are added normally
        $routeProvider.when(path, route);
      }
    });
    // routes which are not in our map are redirected to /home
    $routeProvider.otherwise({redirectTo: '/start'});
  }]);
