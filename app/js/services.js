(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', [])

      // put your services here!
      // .service('serviceName', ['dependency', function(dependency) {}]);

    .factory('messageList', ['fbutil', function(fbutil) {
      return fbutil.syncArray('messages', {limit: 10, endAt: null});
    }])

    .factory('joinedPlayersList', ['fbutil', function(fbutil) {
      return fbutil.syncArray('joinedPlayers', {endAt: null});
    }])

    .service('gameRunner', function($timeout, gameTypeForRoom) {
      this.GAMES = ["tap", "shake"];
      this.MAX_GAMES = 5;
      this.GAME_LENGTH = 5000; // 10 seconds

      this.startNewGame = function(roomId) {
        this.gameIndex = 0;
        this.gameType = gameTypeForRoom(roomId);
        this.switchGame();
      };

      this.switchGame = function() {
        if (this.gameIndex == this.MAX_GAMES) {
          // TODO Show game over screen with final scores
          console.log('game over');
          return;
        }
        // TODO update the scores when we switch the game
        this.gameIndex++;
        var newGame = Math.floor((Math.random() * this.GAMES.length));
        this.gameType.$value = this.GAMES[newGame];
        this.gameType.$save();

        console.log('game ' + this.gameIndex + ' is ' + this.GAMES[newGame]);
        $timeout(this.switchGame.bind(this), this.GAME_LENGTH);
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

    .factory('gameTypeForRoom', ['fbutil', function(fbutil) {
      return function(roomId) {
        return fbutil.syncObject('room/' + roomId + '/game/type' );
      };
    }]);

})();
