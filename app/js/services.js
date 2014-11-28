(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', [])

    .service('gameRunner', function($rootScope, $location, $interval, $timeout, gameDataService, playersService) {
      // map of game ID to start function that returns a promise
      // which resolves to a list of winners when the game is over
      this.startFunctions = {};
      this.gamesList = [];
      this.games = [];
      this.NUMBER_OF_GAMES = 6;
      this.currentRoom = null;
      this.players = {};
      this.playersList = [];
      this.gameOrder = [];

      $rootScope.$watch(gameDataService.isRestarted.bind(gameDataService), function(isRestarted) {
        if (isRestarted) {
          this.resetScores();
          this.startNewGame($location.search().code);
        }
      }.bind(this));

      //@ http://jsfromhell.com/array/shuffle [v1.0]
      var shuffle = function(o) { //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
      };

      $rootScope.$watch(function() {
        // Watch for scope.code to change, but only start when there
        // are registered games.
        return $location.search().code && this.games.length >= this.NUMBER_OF_GAMES;
      }.bind(this), function() {
        this.startNewGame($location.search().code);
      }.bind(this));

      this.registerGame = function(gameId, startFunction) {
        this.startFunctions[gameId] = startFunction;
        // TODO separate lists not necessary
        this.gamesList.push(gameId);
        this.games.push(gameId);
      };

      this.startNewGame = function(roomId) {
        this.gameOrder = shuffle(this.gamesList.concat(this.gamesList));
        this.currentRoom = roomId;
        this.players = playersService.asObject(roomId);
        this.playersList = playersService.asArray(roomId);
        gameDataService.setNumber(-1);
        this.waitingScreen([]);
      };

      this.switchGame = function() {
        gameDataService.setState(gameDataService.STATES.PLAYING);
        var newGame = this.gameOrder[this.getNextGameNumber()];
        gameDataService.startGame(newGame, this.players);
        this.startGame(newGame);
      };

      this.startGame = function(gameType) {
        if (!this.startFunctions[gameType]) {
          throw new Error(gameType + ' is not a valid game type');
        }
        this.startFunctions[gameType](this.currentRoom).then(function(winners) {
          this.waitingScreen(winners);
        }.bind(this));
      };

      this.waitingScreen = function(winners) {
        var end;
        if (this.getNextGameNumber() >= this.gameOrder.length) {
          gameDataService.setState(gameDataService.STATES.DONE);
          end = true;
        } else {
          gameDataService.setState(gameDataService.STATES.WAITING);
          end = false;
        }
        $rootScope.winners = winners;

        var count = 50;
        // Store the room so we don't update the wrong game.
        var room = this.currentRoom;
        var waitInterval = $interval(function() {
          if (!this.currentRoom || this.currentRoom != room) {
            $interval.cancel(waitInterval);
            return;
          }
          count = count - 1;

          if (count == 45) {
            // update score
            this.incrementWinnerScores(winners);
          }
          if (count <= 0) {
            if (!end) {
              this.switchGame();
            }
            $interval.cancel(waitInterval);
          } else {
            $rootScope.countdown = count;
          }
        }.bind(this), 100);
      };

      this.incrementWinnerScores = function(winners) {
        winners.forEach(function(player) {
          var currentScore = parseInt(this.players[player.$id].score, 10) || 0;
          this.players[player.$id].score = currentScore + 1;
        }.bind(this));
        this.players.$save();
      };

      this.resetScores = function() {
        this.playersList.forEach(function(player) {
          this.players[player.$id].score = 0;
        }.bind(this));
        this.players.$save();
      };

      this.getNextGameNumber = function() {
        return (gameDataService.getNumber() || 0) + 1;
      };

      // Return the players with the highest score, but only if
      // that score is greater than or equal to minToWin. If there
      // are no winners, return null.
      this.getHighWinners = function(gameData, players, minToWin) {
        if (!gameData) {
          return;
        }
        var highestScore = 0;
        players.forEach(function(player) {
          var score = gameData[player.$id];
          if (score >= highestScore) {
            highestScore = score;
          }
        });

        if (highestScore < minToWin) {
          return null;
        }

        var winners = [];
        players.forEach(function(player) {
          if(gameData[player.$id] == highestScore) {
            winners.push(player);
          }
        });
        return winners;
      };

      this.getMatchingWinners = function(gameData, players, expectedValue) {
        var winners = [];
        var allAnswered = true;
        players.forEach(function(player) {
          if (!gameData[player.$id]) {
            // player hasn't answered;
            allAnswered = false;
          } else if(gameData[player.$id] == expectedValue) {
            winners.push(player);
          }
        });
        if (winners.length == 0) {
          if (allAnswered) {
            return [];
          }
          return null;
        }
        return winners;
      };
    })

    .service('playersService', function(fbutil) {
      this.asArray = function(roomId) {
        return fbutil.syncArray('room/' + roomId + '/players' , {endAt: null});
      };

      this.asObject = function(roomId) {
        return fbutil.syncObject('room/' + roomId + '/players' , {endAt: null});
      };
    })

    // Service for getting game data (current number, type, and player data)
    .service('gameDataService', function($rootScope, fbutil, playersService) {
      this.currentRoom = null;
      this.gameData = null;
      this.currentRoom = null;
      this.players = null;

      this.STATES = {
        NOT_STARTED: 'not-started',
        RESTARTED: 'restarted',
        WAITING: 'waiting',
        PLAYING: 'playing',
        DONE: 'done'
      };

      this.joinRoom = function(roomId) {
        this.currentRoom = roomId;
        this.players = playersService.asArray(roomId);
        this.games = fbutil.syncObject('room/' + roomId + '/games' , {endAt: null});
        this.currentGame = fbutil.syncObject('room/' + roomId + '/currentGame');
        this.state = fbutil.syncObject('room/' + roomId + '/state');
        this.setState(this.STATES.NOT_STARTED);
      };

      // Add a new game at the next number and update currentGame
      this.startGame = function(type) {
        var nextNumber = (this.getNumber() || 0) + 1;
        this.setNumber(nextNumber);
        var playerData = {};
        this.players.forEach(function(player) {
          playerData[player.$id] = 0;
        });

        this.games[nextNumber.toString()] = {
          type: type,
          data: playerData
        };
        this.games.$save();

        console.log('game ' + this.getNumber() + ' is ' + this.getType());
      };

      // number
      this.getNumber = function() {
        return parseInt(this.currentGame.$value, 10);
      };

      this.setNumber = function(number) {
        this.currentGame.$value = number;
        this.currentGame.$save();
      };

      // string
      this.getType = function() {
        if (this.isWaiting() || !this.games[this.getNumber()]) {
          return '';
        }
        return this.games[this.getNumber()].type;
      };

      this.setState = function(state) {
        this.state.$value = state;
        this.state.$save();
      };

      this.getState = function() {
        if (!this.state) {
          return null;
        }
        return this.state.$value;
      };

      this.isStarted = function() {
        return this.getState() && this.getState() != this.STATES.NOT_STARTED;
      };

      this.isWaiting = function() {
        return this.getState() == this.STATES.WAITING;
      };

      this.isRestarted = function() {
        return this.getState() == this.STATES.RESTARTED;
      };

      this.isPlaying = function() {
        return this.getState() == this.STATES.PLAYING;
      };

      this.isDone = function() {
        return this.getState() == this.STATES.DONE;
      };

      // Firebase object with game data for the current room and number
      this.getGameData = function() {
        return fbutil.syncObject('room/' + this.currentRoom + '/games/' + this.getNumber() + '/data' , {endAt: null});
      };

      this.clearData = function() {
        var ref = fbutil.ref('room/' + this.currentRoom + '/game/data');
        ref.remove();
      };
    });

})();
