angular.module('myApp.games', [])

.directive('buttonClickGame', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/buttonClick.html',
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
});
