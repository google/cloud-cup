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
})

.directive('swipeGame', function($q, $interval, gameRunner, gameDataService, fbutil) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/swipe.html',
    link: function($scope) {
      var interval;

      var init = function() {
        $scope.potatoIndex = -1;
        $scope.life = [];
        $scope.players.forEach(function(player) {
          $scope.life.push(80);
        });
      }

      init();

      $scope.color = function(n) {
        console.log(n);
        var r = 255 - n*3;
        var g = 255;
        if (n <= 60) {
          g -= (60 - n) * 4;
        }
        ret = 'rgb(' + r + ', ' + g + ', 0)';
        console.log(ret);
        return ret;
      }

      var movePotato = function() {
        var rnd;
        do {
          rnd = Math.floor((Math.random() * $scope.players.length));
        } while (rnd == $scope.potatoIndex);
        $scope.potatoIndex = rnd;
        var playerId = $scope.players[$scope.potatoIndex].$id;
        $scope.currentPlayerTap = $scope.gameData[playerId];
      };

      var gameEnd = function(deferred) {
        $interval.cancel(interval);

        var best = -1000;
        var winners = [];
        for (var i = 0; i < $scope.players.length; i++) {
          var player = $scope.players[i];
          if ($scope.life[i] > best) {
            best = $scope.life[i];
            winners = [];
          }
          if ($scope.life[i] == best) {
            winners.push(player);
          }
        }

        deferred.resolve(winners);
      };

      var gameLoop = function(deferred) {
        var playerId = $scope.players[$scope.potatoIndex].$id;

        if ($scope.currentPlayerTap != $scope.gameData[playerId]) {
          movePotato();
          return;
        }

        $scope.life[$scope.potatoIndex] = $scope.life[$scope.potatoIndex] - 1;
        if ($scope.life[$scope.potatoIndex] <= 0) {
          gameEnd(deferred);
        }
      };

      var gameStart = function(deferred) {
        if ($scope.players.length < 2) {  // We need at least 2 players.
          deferred.resolve([]);
          return;
        }
        init();
        movePotato();
        interval = $interval(function() {
          gameLoop(deferred);
        }, 100);
      };

      gameRunner.registerGame('swipe', function() {
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        gameStart(deferred);
        return deferred.promise;
      }.bind('this'));
    }
  };
})

// math
.directive('mathGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/math.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      // Random number from 1 to maxValue
      function randomNumber(maxValue) {
        return Math.floor(Math.random() * (maxValue - 1) + 1);
      }

      function setNewExpression() {
        var int1 = randomNumber(100);
        var int2 = randomNumber(100);
        var operation = '';
        var result = 0;

        switch(randomNumber(3)) {
          case 1: // +
            result = int1 + int2;
            operation = '+';
            break;
          case 2: // -
            if (int1 < int2) {
              // to avoid negative numbers, switch the values
              var temp = int1;
              int1 = int2;
              int2 = temp;
            }
            result = int1 - int2;
            operation = '-';
            break;
          case 3: // *
            result = int1 * int2;
            operation = '*';
            break;
        }
        // Don't allow answers of 0 since the default score
        // value is 0...
        if (result == 0) {
          return setNewExpression();
        }
        $scope.expression = int1 + ' ' + operation + ' ' + int2;
        return result;
      }

      $scope.getStyle = function(player) {
        if (!$scope.gameData) {
          return;
        }
        var data = $scope.gameData[player.$id];
        if (!data || data == 0) {
          return 'mathNoAnswer';
        } else if (data == $scope.answer) {
          return 'mathCorrectAnswer';
        } else {
          return 'mathWrongAnswer';
        }
      };

      gameRunner.registerGame('math', function() {
        var answer = setNewExpression();
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getMatchingWinners($scope.gameData,
            $scope.players, answer);
          if (winners != null) {
            deferred.resolve(winners);
          }
        });
        return deferred.promise;
      });
    }
  };
});
