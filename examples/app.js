angular.module('app', ['smart-complete']).controller('AppCtrl', ['$scope', '$timeout',
  function($scope, $timeout) {
    $scope.searchContacts = function(s, callback) {
      var rs = [];
      if (s != null && s.length > 1) {
        for (var i = 0; i < 10; i++) {
          rs.push({
            label: s + i,
            value: s + i
          });
        }
      }
        callback(rs);
    };
  }
]);
