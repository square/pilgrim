pilgrimApp.controller('MessageCtrl', ['$scope',
  function($scope) {

    $scope.fieldType = function(field) {
      if(!field) return;
      if(field.repeated) return 'repeated';
      if(field.required) return 'required';
      return 'optional'
    }

    $scope.$watch('activeTab', function() {
      var theProto;
      if(!$scope.activeTab || !$scope.activeTab.protoObject.isMessage) {
        $scope.ownPackageFields = {};
        $scope.otherPackageFields = [];
      } else {
       theProto = $scope.activeTab.protoObject;
       $scope.ownPackageFields = { pkg: theProto.package, fields: theProto.protoObject.fieldsByPkg[undefined] }

       $scope.otherPackageFields = [];
       Object.keys(theProto.protoObject.fieldsByPkg).forEach(function(k) {
         if(k == 'undefined') return;
         $scope.otherPackageFields.push({pkg: k, fields: theProto.protoObject.fieldsByPkg[k]});
       });
      }
    });

    $scope.isComplexType = function(field) {
      switch (field.fieldType) {
        case 'TYPE_MESSAGE':
        case 'TYPE_ENUM':
        case 'TYPE_SERVICE':
          return true;
        default:
          return false;
      }
    };
  }
]);
