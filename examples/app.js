angular.module('app', ['smart-complete']).controller('AppCtrl', function($scope, $q) {
  $scope.searchContacts = function(s) {
    var i, rs, _i;
    rs = [];
    if (s !== null && s.length > 1) {
      for (i = _i = 0; _i <= 10; i = ++_i) {
        rs.push({
          label: s + i,
          value: s + i
        });
      }
    }
    return $q.when(rs);
  };
  return $scope.afterSelectUser = function(value, label) {
    return console.log(value, label);
  };
});
