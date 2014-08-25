var pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('TabsCtrl', ['$scope', '$http', '$modal', '$location',
  function($scope, $http, $modal, $location) {
    var $optionsModalInstance;
    $scope.tabs = [];
    $scope.activeTab = undefined;

    $scope.setCurrentTab = function(protoObject) {
      if(!protoObject) return;
      window.theThing = protoObject;
      var tab = _.findWhere($scope.tabs, {protoObject: protoObject});

      if(!tab) {
        tab = { protoObject: protoObject};
        $scope.tabs.push(tab);
      }

      tab.active = true;
      if($scope.activeTab) $scope.activeTab.active = false;
      $scope.activeTab = tab;
    };

    $scope.removeTab = function(tab) {
      if($scope.tabs.indexOf(tab) < 0) return;
      var idx = $scope.tabs.indexOf(tab),
          tab = $scope.tabs[idx];

      $scope.tabs.splice(idx, 1);

      if(tab == $scope.activeTab) {
        $scope.activeTab = undefined;
        if($scope.tabs.length) {
          var lastTab = $scope.tabs[$scope.tabs.length - 1];
          $location.path('/protos/' + lastTab.protoObject.fullName);
        }
      }
    }

    $scope.protoFileLink = function(thing) {
      return "/protos-cache/all-protos/" + thing.fileDescriptor.getf('name');
    }

    $scope.openOptionsModal = function(field) {
      $optionsModalInstance = $modal.open({
        templateUrl: 'optionsModal.html',
        controller: OptionsModalCtrl,
        resolve: {
          fieldOptions: function() { return {field: field}}
        }
      });
    };

    function OptionsModalCtrl($scope, fieldOptions) {
      $scope.fieldOptions = fieldOptions;
      $scope.close = function() {
        if($optionsModalInstance) {
          $optionsModalInstance.dismiss('cancel');
          $optionsModalInstance = undefined;
        }
      }
    }

    function ProtoModalCtrl($modalInstance, $scope, fileName, protoFileContent) {
      $scope.fileName = fileName;
      $scope.protoFileContent = protoFileContent;

      $scope.close = function() {
        $modalInstance.dismiss('cancel');
      }
    };
  }
]);
