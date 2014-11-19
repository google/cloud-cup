angular.module('myApp.games', [])

.directive('waitingScreen', function($q, $timeout) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/waiting.html',
  };
})

// tap
.directive('tapGame', function($q) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/tap.html',
    link: function($scope) {
      var gameCtrl = $scope.gameCtrl;
      $scope.maxTaps = 20;
      $scope.range = function(min, max) {
        var input = [];
        for (var i = min; i <= max; i++) {
          input.push(i);
        }
        return input;
      };

      function checkForWinners() {
        if (!$scope.gameData || !$scope.gameData.players) {
          return;
        }
        var playerData = $scope.gameData.players;
        var highestScore = 0;
        $scope.players.forEach(function(player) {
          var score = playerData[player.$id];
          if (score >= highestScore) {
            highestScore = score;
          }
        });

        if (highestScore < $scope.maxTaps) {
          return null;
        }

        var winners = [];
        $scope.players.forEach(function(player) {
          if(playerData[player.$id] == highestScore) {
            winners.push(player);
          }
        });
        return winners;
      }

      gameCtrl.registerGame('tap', function() {
        var deferred = $q.defer();
        $scope.gameMetadata.$watch(function() {
          var winners = checkForWinners();
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
.directive('shakeGame', function($q, $timeout) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/shake.html',
    link: function($scope) {
      // $scope.gameCtrl.registerGame('shake', function() {
      //   var deferred = $q.defer();
      //   $timeout(function() {
      //     deferred.resolve([1, 2]);
      //   }, 5000);
      //   return deferred.promise;
      // });
    }
  };
});
