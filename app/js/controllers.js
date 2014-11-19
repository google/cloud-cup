'use strict';

/* Controllers */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

angular.module('myApp.controllers', ['firebase.utils'])
  .controller('StartCtrl', ['$scope', '$location', 'fbutil', 'playersService',
      function($scope, $location, fbutil, playersService) {
    $scope.code = null;

    $scope.start = function() {
      $location.path('/game');
      $location.search('code', $scope.code);
    };

    // Just for testing when we have no phone
    $scope.addDummyPlayers = function() {
      var p1 = {'name': 'Mirna',
                'imageUrl': 'https://lh5.googleusercontent.com/-K0EoyJLIo4E/AAAAAAAAAAI/AAAAAAAADH0/-DOy9kRTn14/photo.jpg?sz=100'}
      fbutil.ref('room/' + $scope.code + '/players').push(p1);
    }

    var findRoomId = function(n) {
      // Each time we don't find a room, we multiply the range by 2.
      var roomId = randomInt(0, 100 * n);

      // Check if the random id is available
      fbutil.ref('rooms/' + roomId).once('value', function(snap) {
        if (snap.val() != null) {
          findRoomId(n * 2);
          return;
        }

        // Register the room.
        // TODO: There could be a race condition though.
        var obj = {};
        obj[roomId] = true;
        fbutil.ref('room/' + roomId).remove(); // make sure the state is clean
        fbutil.ref('rooms').update(obj);
        $scope.players = playersService.asArray(roomId);
        $scope.code = roomId;
      });
    };

    $scope.init = function() {
      findRoomId(1);
    };

  }])

  .controller('GameCtrl', function($scope, $location, gameRunner, playersService, gameDataService, gameMetadataForRoom) {
    $scope.code = $location.search().code;
    $scope.players = playersService.asArray($scope.code);
    $scope.gameData = gameDataService.forRoom($scope.code);
    $scope.gameMetadata = gameMetadataForRoom($scope.code);
    $scope.gameCtrl = this;

    // map of game ID to start function that returns a promise
    // which resolves to a list of winners when the game is over
    this.startFunctions = {};
    this.games = [];
    this.MAX_GAMES = 5;
    this.GAME_LENGTH = 5000; // 10 seconds
    this.currentRoom;

    this.registerGame = function(gameId, startFunction) {
      this.startFunctions[gameId] = startFunction;
      // TODO separate list not necessary
      this.games.push(gameId);
    };

    this.startNewGame = function(roomId) {
      this.currentRoom = roomId;
      this.gameMetadata = gameMetadataForRoom(roomId);
      gameRunner.setGame(0, null);
      this.switchGame();
    };

    this.switchGame = function() {
      if (this.gameMetadata.number == this.MAX_GAMES) {
        // TODO Show game over screen with final scores
        console.log('game over');
        return;
      }

      var newGame = this.games[Math.floor((Math.random() * this.games.length))];
      gameRunner.setGame(gameRunner.getNextGameNumber(), newGame);
      this.startGame(newGame);
    };

    this.startGame = function(gameType) {
      if (!this.startFunctions[gameType]) {
        throw new Error(gameType + ' is not a valid game type');
      }
      this.startFunctions[gameType](this.currentRoom).then(function(winners) {
        // update score
        gameRunner.incrementWinnerScores(winners);
        this.switchGame();
      }.bind(this));
    };

    $scope.$watch(function() {
      // Watch for scope.code to change, but only start when there
      // are registered games.
      return $scope.code && this.games.length > 0;
    }.bind(this), function() {
      if (this.games.length > 0) {
        gameRunner.setRoom($scope.code);
        this.startNewGame($scope.code);
      }
    }.bind(this));
  });
