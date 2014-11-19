(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', [])

    .factory('joinedPlayersList', ['fbutil', function(fbutil) {
      return fbutil.syncArray('joinedPlayers', {endAt: null});
    }])

    .service('gameRunner', function($timeout, gameMetadataForRoom) {
      this.GAMES = ["tap", "shake"];
      this.MAX_GAMES = 5;
      this.GAME_LENGTH = 5000; // 10 seconds

      this.startNewGame = function(roomId) {
        this.gameIndex = 0;
        this.gameMetadata = gameMetadataForRoom(roomId);
        this.setGameNumber(0);
        this.switchGame();
      };

      this.switchGame = function() {
        if (this.gameMetadata.number == this.MAX_GAMES) {
          // TODO Show game over screen with final scores
          console.log('game over');
          return;
        }
        // TODO update the scores when we switch the game
        this.setGameNumber((this.gameMetadata.number || 0) + 1);
        var newGame = Math.floor((Math.random() * this.GAMES.length));
        this.gameMetadata.type = this.GAMES[newGame];
        this.gameMetadata.$save();

        console.log('game ' + this.gameMetadata.number + ' is ' + this.GAMES[newGame]);
        $timeout(this.switchGame.bind(this), this.GAME_LENGTH);
      };

      this.setGameNumber = function(gameNumber) {
        this.gameMetadata.number = gameNumber;
        this.gameMetadata.$save();
      };
    })

    .factory('playersForRoom', ['fbutil', function(fbutil) {
      return function(roomId) {
        return fbutil.syncArray('room/' + roomId + '/players' , {endAt: null});
      };
    }])

    .factory('gameDataForRoom', ['fbutil', function(fbutil) {
      return function(roomId) {
        return fbutil.syncObject('room/' + roomId + '/game/data' , {endAt: null});
      };
    }])

    .factory('gameMetadataForRoom', ['fbutil', function(fbutil) {
      return function(roomId) {
        return fbutil.syncObject('room/' + roomId + '/game' );
      };
    }]);

})();
