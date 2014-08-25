var pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('ExplorerCtrl', ['$scope',
  function($scope) {
    $scope.query = { scopedFilter: {service: true}};
  }
]);
