angular.module('app', ['smart-complete']).controller('AppCtrl', function($scope, $q) {
  $scope.searchFunc = function(s) {
    var raw = [
      'BeiJing', 'ShangHai', 'GuangZhou', 'TianJing', 'ChongQing', 'WenZhou',
      'ShenZhen', 'HangZhou', 'ZhengZhou', 'HeFei', 'SuZhou', 'WuHan',
      'HaErBin', 'ChangChun', 'ShenYang', 'ShiJiaZhuang', 'ChangSha'
    ];

    var reg = new RegExp((s + '').replace(/[^a-zA-Z0-9\-_]/g, function(s) {
      return '\\' + s;
    }), 'i', 'g');

    return $q.when(raw.filter(function(item) {
      return reg.test(item);
    }).map(function(item) {
      return {
        value: item,
        label: item.replace(reg, function(s) {
          return '<b>' + s + '</b>';
        })
      };
    }));
  };
  return $scope.afterSelectUser = function(value, label) {
    return console.log(value, label);
  };
});
