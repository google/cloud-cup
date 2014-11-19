'use strict';

/* Controllers */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

angular.module('myApp.controllers', ['firebase.utils', 'simpleLogin'])
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
      fbutil.ref('room/' + $scope.code + '/players/1').update(p1);
      var p2 = {'name': 'Other Mirna',
                'imageUrl': 'https://lh5.googleusercontent.com/-K0EoyJLIo4E/AAAAAAAAAAI/AAAAAAAADH0/-DOy9kRTn14/photo.jpg?sz=100'}
      fbutil.ref('room/' + $scope.code + '/players/2').update(p2);
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
    $scope.gameType = gameMetadataForRoom($scope.code).type;

    $scope.$watch('code', function() {
      gameRunner.startNewGame($scope.code);
    });
  })

  .controller('ChatCtrl', ['$scope', 'messageList', function($scope, messageList) {
    $scope.messages = messageList;
    $scope.addMessage = function(newMessage) {
      if( newMessage ) {
        $scope.messages.$add({text: newMessage});
      }
    };
  }])

  .controller('LoginCtrl', ['$scope', 'simpleLogin', '$location', function($scope, simpleLogin, $location) {
    $scope.email = null;
    $scope.pass = null;
    $scope.confirm = null;
    $scope.createMode = false;

    $scope.login = function(email, pass) {
      $scope.err = null;
      simpleLogin.login(email, pass)
        .then(function(/* user */) {
          $location.path('/account');
        }, function(err) {
          $scope.err = errMessage(err);
        });
    };

    $scope.createAccount = function() {
      $scope.err = null;
      if( assertValidAccountProps() ) {
        simpleLogin.createAccount($scope.email, $scope.pass)
          .then(function(/* user */) {
            $location.path('/account');
          }, function(err) {
            $scope.err = errMessage(err);
          });
      }
    };

    function assertValidAccountProps() {
      if( !$scope.email ) {
        $scope.err = 'Please enter an email address';
      }
      else if( !$scope.pass || !$scope.confirm ) {
        $scope.err = 'Please enter a password';
      }
      else if( $scope.createMode && $scope.pass !== $scope.confirm ) {
        $scope.err = 'Passwords do not match';
      }
      return !$scope.err;
    }

    function errMessage(err) {
      return angular.isObject(err) && err.code? err.code : err + '';
    }
  }])

  .controller('AccountCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location',
    function($scope, simpleLogin, fbutil, user, $location) {
      // create a 3-way binding with the user profile object in Firebase
      var profile = fbutil.syncObject(['users', user.uid]);
      profile.$bindTo($scope, 'profile');

      // expose logout function to scope
      $scope.logout = function() {
        profile.$destroy();
        simpleLogin.logout();
        $location.path('/login');
      };

      $scope.changePassword = function(pass, confirm, newPass) {
        resetMessages();
        if( !pass || !confirm || !newPass ) {
          $scope.err = 'Please fill in all password fields';
        }
        else if( newPass !== confirm ) {
          $scope.err = 'New pass and confirm do not match';
        }
        else {
          simpleLogin.changePassword(profile.email, pass, newPass)
            .then(function() {
              $scope.msg = 'Password changed';
            }, function(err) {
              $scope.err = err;
            });
        }
      };

      $scope.clear = resetMessages;

      $scope.changeEmail = function(pass, newEmail) {
        resetMessages();
        profile.$destroy();
        simpleLogin.changeEmail(pass, newEmail)
          .then(function(user) {
            profile = fbutil.syncObject(['users', user.uid]);
            profile.$bindTo($scope, 'profile');
            $scope.emailmsg = 'Email changed';
          }, function(err) {
            $scope.emailerr = err;
          });
      };

      function resetMessages() {
        $scope.err = null;
        $scope.msg = null;
        $scope.emailerr = null;
        $scope.emailmsg = null;
      }
    }
  ]);
