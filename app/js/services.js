(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', [])

    .service('gameRunner', function($rootScope, $location, $interval, gameDataService, playersService) {
      // map of game ID to start function that returns a promise
      // which resolves to a list of winners when the game is over
      this.startFunctions = {};
      this.games = [];
      this.MAX_GAMES = 5;
      this.GAME_LENGTH = 5000; // 10 seconds
      this.currentRoom = null;
      this.players = {};

      $rootScope.$watch(function() {
        // Watch for scope.code to change, but only start when there
        // are registered games.
        return $location.search().code && this.games.length > 0;
      }.bind(this), function() {
        if (this.games.length > 0) {
          this.startNewGame($location.search().code);
        }
      }.bind(this));

      this.registerGame = function(gameId, startFunction) {
        this.startFunctions[gameId] = startFunction;
        // TODO separate list not necessary
        this.games.push(gameId);
      };

      this.startNewGame = function(roomId) {
        this.currentRoom = roomId;
        this.players = playersService.asObject(roomId);
        gameDataService.setNumber(-1);
        this.waitingScreen();
      };

      this.switchGame = function() {
        var newGame = this.games[Math.floor((Math.random() * this.games.length))];
        gameDataService.startGame(newGame, this.players);
        this.startGame(newGame);
      };

      this.startGame = function(gameType) {
        if (!this.startFunctions[gameType]) {
          throw new Error(gameType + ' is not a valid game type');
        }
        this.startFunctions[gameType](this.currentRoom).then(function(winners) {
          // update score
          this.incrementWinnerScores(winners);
          if (gameDataService.getNumber() == this.MAX_GAMES) {
            this.endScreen();
          } else {
            this.waitingScreen();
          }
        }.bind(this));
      };

      this.endScreen = function() {
        gameDataService.setState(gameDataService.STATES.DONE);
        // TODO Show game over screen with final scores
        console.log('game over');
      };

      this.waitingScreen = function() {
        var self = this;
        var count = 30;
        gameDataService.setState(gameDataService.STATES.WAITING);
        var waitInterval = $interval(function() {
          count = count - 1;
          if (count <= 0) {
            gameDataService.setState(gameDataService.STATES.PLAYING);
            self.switchGame();
            $interval.cancel(waitInterval);
          } else {
            $rootScope.countdown = count;
          }
        }, 100);
      };

      this.incrementWinnerScores = function(winners) {
        winners.forEach(function(player) {
          var currentScore = parseInt(this.players[player.$id].score, 10) || 0;
          this.players[player.$id].score = currentScore + 1;
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

      this.isWaiting = function() {
        return this.state.$value == this.STATES.WAITING;
      };

      this.isPlaying = function() {
        return this.state.$value == this.STATES.PLAYING;
      };

      this.isDone = function() {
        return this.state.$value == this.STATES.DONE;
      }

      this.setState = function(state) {
        this.state.$value = state;
        this.state.$save();
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
