var pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('ExplorerCtrl', ['$scope',
  function($scope) {
    $scope.query = {
      scopedFilter: {service: false, message: true, enum: true} // need to invert this for the toggle code
    };

    $scope.handleKeypress = function($event) {
      if($event.which == 47 || $event.which == 191) { // '/' key pressed
        $scope.searchFocusEvent = $event;
      }

      if($event.ctrlKey) {
        switch ($event.which) {
          case 19: // s
            $scope.toggleServices = new Date();
            break;
          case 5: // e
            $scope.toggleEnums = new Date();
            break;
          case 13: // m
            $scope.toggleMessages = new Date();
            break;
          default:
            break;
        }
      }
    };
  }
]);
