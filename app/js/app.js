'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngAnimate',
    'myApp.config',
    'myApp.controllers',
    'myApp.decorators',
    'myApp.directives',
    'myApp.games',
    'myApp.filters',
    'myApp.routes',
    'myApp.services'
  ])

  .run(['simpleLogin', function(simpleLogin) {
    console.log('run'); //debug
    simpleLogin.getUser();
  }])
