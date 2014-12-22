angular.module 'app', ['smart-complete']
  .controller 'AppCtrl', ['$scope', '$timeout', ($scope, $timeout) ->
    $scope.searchContacts = (s, callback) ->
      rs = []
      if s != null and s.length > 1
        for i in [0..10]
          rs.push({
            label: s + i,
            value: s + i
          })
      callback(rs)
    $scope.afterSelectUser = (value, label) ->
      console.log value, label
  ]
