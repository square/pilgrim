var  pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('ObjectListCtrl', ['$scope', '$location', 'protos', '$log',
  function($scope, $location, protos, $log) {
    $scope.protos = protos;

    $scope.$watch('query.search', _.debounce(function() {
      $scope.$apply(function() {
        $scope.query.objectQuery = $scope.query.search;
      });
    }, 250));
  }
]);

