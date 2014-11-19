'use strict';

/* Controllers */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

angular.module('myApp.controllers', ['firebase.utils'])
  .controller('StartCtrl', ['$scope', '$location', 'fbutil', 'playersForRoom',
      function($scope, $location, fbutil, playersForRoom) {
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
        };

        // Register the room.
        // TODO: There could be a race condition though.
        var obj = {}
        obj[roomId] = true
        fbutil.ref('room/' + roomId).remove(); // make sure the state is clean
        fbutil.ref('rooms').update(obj);
        $scope.players = playersForRoom(roomId);
        $scope.code = roomId;
      });
    };

    $scope.init = function() {
      findRoomId(1);
    };

  }])

  .controller('GameCtrl', function($scope, $location, gameRunner, playersForRoom, gameDataForRoom, gameMetadataForRoom) {
    $scope.code = $location.search().code;
    $scope.players = playersForRoom($scope.code);
    $scope.gameData = gameDataForRoom($scope.code);
    $scope.gameMetadata = gameMetadataForRoom($scope.code);

    $scope.$watch('code', function() {
      gameRunner.startNewGame($scope.code);
    });
  });
