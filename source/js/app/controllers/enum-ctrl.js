pilgrimApp.controller('EnumCtrl', ['$scope',
  function($scope) {
    $scope.$watch('activeTab', function() {
      $scope.enumProto = $scope.activeTab.protoObject;
    });
  }
]);
