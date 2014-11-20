angular.module('myApp.games', [])

// tap
.directive('tapGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/tap.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      gameRunner.registerGame('tap', function() {
        $scope.gameData = gameDataService.getGameData();
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
.directive('shakeGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/shake.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      gameRunner.registerGame('shake', function() {
        $scope.gameData = gameDataService.getGameData();
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
