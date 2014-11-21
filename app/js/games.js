angular.module('myApp.games', [])

// tap
.directive('tapGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/tap.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      gameRunner.registerGame('tap', function() {
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getHighWinners($scope.gameData,
            $scope.players, $scope.maxTaps);
          if (winners != null) {
            deferred.resolve(winners);
          }
        });
        return deferred.promise;
      });
    }
  };
})

// shake
.directive('shakeGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/shake.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      gameRunner.registerGame('shake', function() {
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getHighWinners($scope.gameData,
            $scope.players, $scope.maxTaps);
          if (winners != null) {
            deferred.resolve(winners);
          }
        });
        return deferred.promise;
      });
    }
  };
})

// math
.directive('mathGame', function($q, gameRunner, gameDataService) {
  return {
    restrict: 'E',
    templateUrl: 'partials/games/math.html',
    link: function($scope) {
      $scope.maxTaps = 20;

      // Random number from 1 to maxValue
      function randomNumber(maxValue) {
        return Math.floor(Math.random() * (maxValue - 1) + 1);
      }

      function setNewExpression() {
        var int1 = randomNumber(100);
        var int2 = randomNumber(100);
        var operation = '';
        var result = 0;

        switch(randomNumber(3)) {
          case 1: // +
            result = int1 + int2;
            operation = '+';
            break;
          case 2: // -
            result = int1 - int2;
            operation = '-';
            break;
          case 3: // *
            result = int1 * int2;
            operation = '*';
            break;
        }
        // Don't allow answers of 0 since the default score
        // value is 0...
        if (result == 0) {
          return setNewExpression();
        }
        $scope.expression = int1 + ' ' + operation + ' ' + int2;
        return result;
      }

      $scope.getStyle = function(player) {
        if (!$scope.gameData) {
          return;
        }
        var data = $scope.gameData[player.$id];
        if (!data || data == 0) {
          return 'mathNoAnswer';
        } else if (data == $scope.answer) {
          return 'mathCorrectAnswer';
        } else {
          return 'mathWrongAnswer';
        }
      };

      gameRunner.registerGame('math', function() {
        var answer = setNewExpression();
        $scope.gameData = gameDataService.getGameData();
        var deferred = $q.defer();
        $scope.gameData.$watch(function() {
          var winners = gameRunner.getMatchingWinners($scope.gameData,
            $scope.players, answer);
          if (winners != null) {
            deferred.resolve(winners);
          }
        });
        return deferred.promise;
      });
    }
  };
});
