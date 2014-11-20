'use strict';

/* Directives */


angular.module('myApp.directives', [])

  .directive('appVersion', ['version', function(version) {
    return function(scope, elm) {
      elm.text(version);
    };
  }])

  .directive('waitingScreen', function($q, $timeout) {
    return {
      restrict: 'E',
      templateUrl: 'partials/games/waiting.html',
    };
  })

  .directive('endScreen', function($q, $timeout) {
    return {
      restrict: 'E',
      templateUrl: 'partials/games/end.html',
    };
  })
