angular.module('myApp.games', [])

// tap
.directive('tapGame', function($q, gameRunner) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/tap.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      gameRunner.registerGame('tap', function() {
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getHighWinners($scope.gameData,
            $scope.players, $scope.maxTaps);
          if (winners != null) {
            deferred.resolve(winners);
          }
        });
        return deferred.promise;
      });
    }
  };
})

// shake
.directive('shakeGame', function($q, gameRunner) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/shake.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      gameRunner.registerGame('shake', function() {
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getHighWinners($scope.gameData,
            $scope.players, $scope.maxTaps);
          if (winners != null) {
            deferred.resolve(winners);
          }
        });
        return deferred.promise;
      });
    }
  };
});
