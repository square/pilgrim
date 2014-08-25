var pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('TabCtrl', ['$scope', '$routeParams', 'protosByName',
  function($scope, $routeParams, protosByName) {
    var name = $routeParams.fullProtoName,
        proto = protosByName[name];

    $scope.setCurrentTab(proto);
  }
]);
