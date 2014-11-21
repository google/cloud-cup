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

// sequence
.directive('sequenceGame', function($q, $timeout, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/sequence.html',
    link: function($scope) {
      var sequenceLength = 100;
      var colors = [
        'r' /*red*/, 'g' /*green*/, 'b' /*blue*/, 'y' /*yellow*/
      ];

      $scope.color = null;
      var sequence = null;
      $scope.playerStatus = {};
      var index = 0;
      var deferred = null;
      var currentTimeout = null;

      // Generates a random color from the colors list.
      // If opt_excludedColor is non-null, ensures it is not
      // returned;
      function randomColor(opt_excludedColor) {
        var rand = Math.floor(Math.random() * 4);
        var color = colors[rand];
        if (opt_excludedColor && color == opt_excludedColor) {
          return randomColor(opt_excludedColor);
        } else {
          return color;
        }
      }

      function genSequence() {
        var sequence = [];
        sequence[0] = randomColor();
        for (var i = 1; i < sequenceLength; i++) {
          // Don't allow duplicate colors in a row
          sequence.push(randomColor(sequence[i - 1]));
        }
        return sequence;
      }

      function run() {
        // TODO get faster as game progresses
        currentTimeout = $timeout(function() {
          $scope.color = sequence[index];
          index++;
          if (!checkForWinners()) {
            run();
          }
        }, 1000);
      }

      $scope.getStyle = function(color) {
        switch(color) {
          case 'r':
            return 'googleRed';
          case 'b':
            return 'googleBlue';
          case 'g':
            return 'googleGreen';
          case 'y':
            return 'googleYellow';
          default:
            return '';
        }
      }

      // returns true if has winners (game over)
      function checkForWinners() {
        var remainingPlayers = [];
        $scope.players.forEach(function(player) {
          var playerId = player.$id;
          if (!$scope.playerStatus[playerId]) {
            // player already out
            return;
          }
          if (!isValid($scope.gameData[playerId])) {
            $scope.playerStatus[playerId] = false;
          } else {
            remainingPlayers.push(player);
          }
        });

        // If there is one or zero remaining players, game over
        if (remainingPlayers.length == 0 || remainingPlayers.length == 1) {
          deferred.resolve(remainingPlayers);
          if (currentTimeout) {
            $timeout.cancel(currentTimeout);
          }
          return true;
        }
        return false;
      }

      function isValid(playerSequence) {
        // We don't have any data yet
        if (playerSequence == 0) {
          // Player fails if there have been at least
          // 5 values and they haven't entered anything.
          return index < 5;
        }
        for (var i = 0; i < sequence.length; i++) {
          var playerInput = playerSequence.charAt(i);
          if (i > index) {
            return true;
          }
          if (!playerInput || playerInput == '') {
            if (i < index - 4) {
              return false;
            }
            // The player is behind but hasn't failed yet
            return true;
          }
          if (playerInput != sequence[i]) {
            return false;
          }
        }
        return false;
      }

      function initPlayers() {
        remainingPlayers = [];
        $scope.players.forEach(function(player) {
          $scope.playerStatus[player.$id] = true;
        });
      }

      gameRunner.registerGame('sequence', function() {
        $scope.color = '';
        sequence = genSequence();
        initPlayers();
        index = 0;
        run();

        $scope.gameData = gameDataService.getGameData();
        deferred = $q.defer();
        $scope.gameData.$watch(function() {
          checkForWinners();
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
      $scope.maxTaps = 100;
      var interval;

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
        $scope.life = [];
        $scope.players.forEach(function(player) {
          $scope.life.push(80);
        });
        $scope.potatoIndex = -1;
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

      $scope.getPlayerStyle = function(player) {
        if (!$scope.gameData) {
          return;
        }
        var data = $scope.gameData[player.$id];
        if (!data || data == 0) {
          return 'avatarNoAnswer';
        } else if (data == $scope.answer) {
          return 'avatarCorrectAnswer';
        } else {
          return 'avatarWrongAnswer';
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
            // TODO add a delay and show the correct answer
            deferred.resolve(winners);
          }
        });
        return deferred.promise;
      });
    }
  };
});
