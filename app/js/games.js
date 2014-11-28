angular.module('myApp.games', [])

// tap
.directive('tapGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/tap.html',
    controllerAs: 'tapCtrl',
    controller: function() {
      this.maxTaps = 20;
    },
    link: function($scope, elem, attr, ctrl) {
      gameRunner.registerGame('tap', function() {
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getHighWinners($scope.gameData,
            $scope.players, ctrl.maxTaps);
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
    controllerAs: 'shakeCtrl',
    controller: function() {
      this.maxTaps = 20;
    },
    link: function($scope, elem, attr, ctrl) {
      gameRunner.registerGame('shake', function() {
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getHighWinners($scope.gameData,
            $scope.players, ctrl.maxTaps);
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
    controllerAs: 'ctrl',
    controller: function($scope) {
      this.sequenceLength = 100;
      this.colors = [
        'r' /*red*/, 'g' /*green*/, 'b' /*blue*/, 'y' /*yellow*/
      ];

      this.color = null;
      this.sequence = null;
      this.playerStatus = {};
      this.index = 0;
      this.deferred = null;
      this.currentTimeout = null;
      this.gameData = null;

      // Generates a random color from the colors list.
      // If opt_excludedColor is non-null, ensures it is not
      // returned;
      this.randomColor = function(opt_excludedColor) {
        var rand = Math.floor(Math.random() * 4);
        var color = this.colors[rand];
        if (opt_excludedColor && color == opt_excludedColor) {
          return this.randomColor(opt_excludedColor);
        } else {
          return color;
        }
      };

      this.genSequence = function() {
        var sequence = [];
        sequence[0] = this.randomColor();
        for (var i = 1; i < this.sequenceLength; i++) {
          // Don't allow duplicate colors in a row
          sequence.push(this.randomColor(sequence[i - 1]));
        }
        return sequence;
      };

      this.run = function() {
        var timeout = 1000 - 100 * Math.floor(this.index/2);
        // TODO get faster as game progresses
        this.currentTimeout = $timeout(function() {
          this.color = this.sequence[this.index];
          this.index++;
          if (!this.checkForWinners()) {
            this.run();
          }
        }.bind(this), timeout);
      };

      this.getStyle = function(color) {
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
      };

      // returns true if has winners (game over)
      this.checkForWinners = function() {
        var remainingPlayers = [];
        $scope.players.forEach(function(player) {
          var playerId = player.$id;
          if (!this.playerStatus[playerId]) {
            // player already out
            return;
          }
          if (!this.isValid(this.gameData[playerId])) {
            this.playerStatus[playerId] = false;
          } else {
            remainingPlayers.push(player);
          }
        }.bind(this));

        // If there is one or zero remaining players, game over
        if (remainingPlayers.length == 0 || remainingPlayers.length == 1) {
          this.deferred.resolve(remainingPlayers);
          if (this.currentTimeout) {
            $timeout.cancel(this.currentTimeout);
          }
          return true;
        }
        return false;
      };

      this.isValid = function(playerSequence) {
        // We don't have any data yet
        if (playerSequence == 0) {
          // Player fails if there have been at least
          // 5 values and they haven't entered anything.
          return this.index < 5;
        }
        for (var i = 0; i < this.sequence.length; i++) {
          var playerInput = playerSequence.charAt(i);
          if (i > this.index) {
            return true;
          }
          if (!playerInput || playerInput == '') {
            if (i < this.index - 4) {
              return false;
            }
            // The player is behind but hasn't failed yet
            return true;
          }
          if (playerInput != this.sequence[i]) {
            return false;
          }
        }
        return false;
      };

      this.init = function() {
        // init players
        remainingPlayers = [];
        $scope.players.forEach(function(player) {
          this.playerStatus[player.$id] = true;
        }.bind(this));

        this.color = '';
        this.sequence = this.genSequence();
        this.index = 0;
        this.run();
      };

      this.play = function() {
        this.gameData = gameDataService.getGameData();
        this.deferred = $q.defer();
        this.gameData.$watch(function() {
          this.checkForWinners();
        }.bind(this));
        return this.deferred.promise;
      };
    },
    link: function($scope, elem, attrs, ctrl) {
      gameRunner.registerGame('sequence', function() {
        ctrl.init();
        return ctrl.play();
      });
    }
  };
})

// turn
.directive('turnGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/turn.html',
    link: function($scope) {
      $scope.maxHalfTurns = 4;

      gameRunner.registerGame('turn', function() {
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getHighWinners($scope.gameData,
            $scope.players, $scope.maxHalfTurns);
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

      var maxLife = 120;
      $scope.maxLife = maxLife;

      var init = function() {
        $scope.potatoIndex = -1;
        $scope.life = [];
        $scope.players.forEach(function(player) {
          $scope.life.push(maxLife);
        });
      }

      $scope.potatoColor = function(n) {
        var r = 255 - n*2;
        var g = 255;
        if (n <= 60) {
          g -= (60 - n) * 4;
        }
        ret = 'rgb(' + r + ', ' + g + ', 0)';
        return ret;
      }

      var getCurrentTaps = function() {
        $scope.currentPlayerTap = [];
        $scope.players.forEach(function (player) {
          $scope.currentPlayerTap.push($scope.gameData[player.$id]);
        });
      }

      init();

      var movePotato = function() {
        var rnd;
        do {
          rnd = Math.floor((Math.random() * $scope.players.length));
        } while (rnd == $scope.potatoIndex);
        $scope.potatoIndex = rnd;
        getCurrentTaps();
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

        if (typeof $scope.currentPlayerTap[0] == 'undefined') {
          getCurrentTaps();
          return;
        }

        for (var i = 0; i < $scope.players.length; i++) {
          var id = $scope.players[i].$id;
          if (id == playerId) {
            continue;
          }
          if ($scope.gameData[id] != $scope.currentPlayerTap[i]) {
            $scope.life[i] = $scope.life[i] - 20;
            if ($scope.life[i] < 0) {
              gameEnd(deferred);
            }
          }
        }

        if ($scope.currentPlayerTap[$scope.potatoIndex] != $scope.gameData[playerId]) {
          movePotato();
          return;
        }

        getCurrentTaps();
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
