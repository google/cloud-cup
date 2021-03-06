'use strict';

/* Controllers */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

angular.module('myApp.controllers', ['firebase.utils'])
  .controller('StartCtrl', ['$scope', '$location', 'fbutil', 'playersService', 'gameDataService',
      function($scope, $location, fbutil, playersService, gameDataService) {
    $scope.code = null;

    $scope.start = function() {
      $location.path('/game');
      $location.search('code', $scope.code);
    };

    // Just for testing when we have no phone
    $scope.addDummyPlayers = function() {
      var p1 = {'name': 'Mirna',
                'imageUrl': 'https://lh5.googleusercontent.com/-K0EoyJLIo4E/AAAAAAAAAAI/AAAAAAAADH0/-DOy9kRTn14/photo.jpg?sz=100'};
      fbutil.ref('room/' + $scope.code + '/players').push(p1);
    };

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
        // TODO: There could be a race condition. Use Firebase.transaction().
        var obj = {};
        // TODO: Use the timestamp as priority, and use that to remove old rooms.
        obj[roomId] = true;
        fbutil.ref('room/' + roomId).remove(); // make sure the state is clean
        fbutil.ref('rooms').update(obj);
        gameDataService.joinRoom(roomId);
        gameDataService.setNumber(-1);
        $scope.players = playersService.asArray(roomId);
        $scope.code = roomId;
      });
    };

    $scope.init = function() {
      findRoomId(1);

      var cancelWatch = $scope.$watch(gameDataService.isStarted.bind(gameDataService), function() {
        if ($location.path().indexOf('start') == -1) {
          cancelWatch();
          return;
        }
        if (gameDataService.isStarted()) {
          cancelWatch();
          $scope.start();
        }
      });
    };

  }])

  .controller('GameCtrl', function($scope, $location, $timeout, gameRunner, playersService, gameDataService) {
    $scope.code = $location.search().code;

    // If our game data service is not populated, use the route parameter to repopulate it.
    // This may happen when refreshing the browser on a room page.
    if(!gameDataService.currentRoom) {
      gameDataService.joinRoom($scope.code);
    }

    $scope.players = playersService.asArray($scope.code);
    $scope.gameDataService = gameDataService;
  });
