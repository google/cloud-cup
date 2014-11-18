angular.module('myApp.games', [])

.directive('tapGame', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/tap.html',
    controller: function($scope) {
      $scope.maxTaps = 20;
      $scope.range = function(min, max) {
        var input = [];
        for (var i = min; i <= max; i++) {
          input.push(i);
        }
        return input;
      };
    }
  };
})

.directive('shakeGame', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/shake.html'
  };
});
