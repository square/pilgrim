pilgrimApp.controller('ServiceCtrl', ['$scope',
  function($scope) {
    $scope.$watch('activeTab', function() {
      $scope.service = $scope.activeTab.protoObject;
    });
  }
]);
