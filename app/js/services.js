(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', [])

    .factory('joinedPlayersList', ['fbutil', function(fbutil) {
      return fbutil.syncArray('joinedPlayers', {endAt: null});
    }])

    .service('gameRunner', function($rootScope, $location, $timeout, gameMetadataForRoom, gameDataService, playersService) {
      // map of game ID to start function that returns a promise
      // which resolves to a list of winners when the game is over
      this.startFunctions = {};
      this.games = [];
      this.MAX_GAMES = 5;
      this.GAME_LENGTH = 5000; // 10 seconds
      this.currentRoom = null;

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
        this.gameMetadata = gameMetadataForRoom(roomId);
        this.players = playersService.asObject(roomId);
        this.setGame(0, null);
        this.switchGame();
      };

      this.switchGame = function() {
        if (this.gameMetadata.number == this.MAX_GAMES) {
          // TODO Show game over screen with final scores
          console.log('game over');
          return;
        }

        var newGame = this.games[Math.floor((Math.random() * this.games.length))];
        this.setGame(this.getNextGameNumber(), newGame);
        this.startGame(newGame);
      };

      this.startGame = function(gameType) {
        if (!this.startFunctions[gameType]) {
          throw new Error(gameType + ' is not a valid game type');
        }
        this.startFunctions[gameType](this.currentRoom).then(function(winners) {
          // update score
          this.incrementWinnerScores(winners);
          this.waitingScreen();
        }.bind(this));
      };

      this.waitingScreen = function() {
        this.gameMetadata.type = '';
        this.gameMetadata.$save();

        var self = this;
        $timeout(function() {
          self.switchGame();
        }, 3000);
      }


      this.incrementWinnerScores = function(winners) {
        winners.forEach(function(player) {
          var currentScore = parseInt(this.players[player.$id].score) || 0;
          this.players[player.$id].score = currentScore + 1;
        }.bind(this));
        this.players.$save();
      };

      this.setGame = function(gameNumber, gameType) {
        this.gameMetadata.number = gameNumber;
        if (gameType) {
          this.gameMetadata.type = gameType;
        }
        this.gameMetadata.$save();
        console.log('game ' + this.gameMetadata.number + ' is ' + this.gameMetadata.type);

        gameDataService.clearData(this.currentRoom);
      };

      this.getNextGameNumber = function() {
        return (this.gameMetadata.number || 0) + 1;
      };

      // Return the players with the highest score, but only if
      // that score is greater than or equal to minToWin. If there
      // are no winners, return null.
      this.getHighWinners = function(gameData, players, minToWin) {
        if (!gameData || !gameData.players) {
          return;
        }
        var playerData = gameData.players;
        var highestScore = 0;
        players.forEach(function(player) {
          var score = playerData[player.$id];
          if (score >= highestScore) {
            highestScore = score;
          }
        });

        if (highestScore < minToWin) {
          return null;
        }

        var winners = [];
        players.forEach(function(player) {
          if(playerData[player.$id] == highestScore) {
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

    // Service for getting game data (current player progress)
    .service('gameDataService', function(fbutil) {
      this.forRoom = function(roomId) {
        return fbutil.syncObject('room/' + roomId + '/game/data' , {endAt: null});
      };

      this.clearData = function(roomId) {
        var ref = fbutil.ref('room/' + roomId + '/game/data');
        ref.remove();
      };
    })

    // Service for getting game metadata (type and number)
    .factory('gameMetadataForRoom', ['fbutil', function(fbutil) {
      return function(roomId) {
        return fbutil.syncObject('room/' + roomId + '/game' );
      };
    }]);

})();
