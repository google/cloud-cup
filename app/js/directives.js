'use strict';

/* Directives */


angular.module('myApp.directives', ['simpleLogin'])

  .directive('appVersion', ['version', function(version) {
    return function(scope, elm) {
      elm.text(version);
    };
  }])
