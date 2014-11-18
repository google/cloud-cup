angular.module('myApp.games', [])

.directive('buttonClickGame', function() {
  return {
    restrict: 'E',
    templateUrl: '/app/partials/buttonClick.html',
    controller: function($scope) {
      $scope.maxTaps = 20;
      $scope.progress = [
        {
          name: 'Sarah',
          taps: 5
        },
        {
          name: 'Laurent',
          taps: 10
        }
      ];

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