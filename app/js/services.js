(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', [])

    .factory('joinedPlayersList', ['fbutil', function(fbutil) {
      return fbutil.syncArray('joinedPlayers', {endAt: null});
    }])

    .service('gameRunner', function($timeout, gameMetadataForRoom, gameDataService, playersService) {
      this.roomId;

      this.setRoom = function(roomId) {
        this.roomId = roomId;
        this.gameMetadata = gameMetadataForRoom(roomId);
        this.players = playersService.asObject(roomId);
      };

      this.incrementWinnerScores = function(winners) {
        winners.forEach(function(player) {
          var score = (this.players[player.$id].score || 0) + 1;
          this.players[player.$id].score = score;
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

        gameDataService.clearData(this.roomId);
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
