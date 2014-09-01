var pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('TabsCtrl', ['$scope', '$http', '$modal', '$location',
  function($scope, $http, $modal, $location) {
    var $optionsModalInstance, $explorerModalInstance;

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

    $scope.exposeServiceExplorer = function() {
      if(!$scope.activeTab) return false;
      var thing = $scope.activeTab.protoObject.protoObject;
      if(!thing.isService) return false;
      var serviceOpts = thing.descriptor.getf('options'),
          fenderOpts = serviceOpts && serviceOpts.getf('fender_service', 'fender.v1');

      if(!fenderOpts) return false;
      if(fenderOpts.getf('cors_enabled'))
      return !!fenderOpts.getf('cors_enabled');
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
      if(!thing) return;
      if($scope.protoSourceUrl) {
        var url = new URL($scope.protoSourceUrl.toString()),
            path = url.pathname + '/' + thing.fileDescriptor.getf('name');

        url.pathname = path = path.replace('//', '/');

        return url.toString();
      } else {
        return '';
      }
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

    $scope.openExplorerModal = function(service) {
      $explorerModalInstance = $modal.open({
        templateUrl: 'serviceExplorerModal.html',
        controller: ServiceExplorerModalCtrl,
        windowClass: "service-explorer",
        resolve: {
          service: function() { return service; }
        }
      });
    };

    function ServiceExplorerModalCtrl($scope, service) {
      $scope.service = service;
      $scope.methodNames = Object.keys(service.methods);

      require('fender').prepareClientServiceHandlers([service]);

      $scope.headers = service.pilgrimHeaders;

      if(!$scope.headers) service.pilgrimHeaders = $scope.headers = [];

      var serviceOptions = service.descriptor.getf('options'),
          serviceFenderOpts = serviceOptions && serviceOptions.getf('fender_service', 'fender.v1');

      $scope.currentAddress = serviceFenderOpts.getf('address');

      $scope.updateServiceAddress = function(address) {
        service.fenderChangeAddress(address);
      };

      $scope.addHeader = function() {
        $scope.headers.push({key: '', value: ''});
      };

      $scope.setCurrentMethod = function(methodName) {
        $scope.currentMethod = undefined;
        $scope.currentResult = undefined;
        var method = service.methods[methodName],
            MessageForm = require('react-fender'),
            requestMessage = method.pilgrimLastRequest;

        $scope.currentMethod = method;

        if(!requestMessage) requestMessage = method.pilgrimLastRequest = new method.inputType();
        if(method.pilgrimLastResponse) $scope.currentResult = method.pilgrimLastResponse;

        function onSubmit(err, value) {
          $scope.$apply(function() {
            if(err) {
              $scope.currentResult = err;
              return false;
            }

            var context = { headers: {} };

            $scope.headers.forEach(function(header) {
              if(header.key && header.value) {
                context.headers[header.key] = header.value;
                console.error(header);
              }
            });

            var theService = new service(context);

            return theService[methodName](value)
            .then(function(resp) {
              $scope.$apply(function() {
                $scope.currentResult = method.pilgrimLastResponse = resp.asJSON();
              });
            })
            .catch(function(error) {
              delete error.clientResponse;
              method.pilgrimLastResponse = error;
              $scope.$apply(function() { $scope.currentResult = error; });
            });
          });
        };

        React.renderComponent(
          new MessageForm({ message: requestMessage, onSubmit: onSubmit }),
          document.getElementById('explorer-method-form')
        );
      }

      $scope.close = function() {
        if($explorerModalInstance) {
          $scope.service = undefined;
          $explorerModalInstance.dismiss('cancel');
          $explorerModalInstance = undefined;
        }
      }
    }

    $scope.fetchProtoFile = function(thing) {
      $scope.protoFileContent = undefined;
      $http.get($scope.protoFileLink(thing))
      .then(
        function(resp){
          $modalInstance = $modal.open({
            templateUrl: 'protoFileModal.html',
            controller: ProtoModalCtrl,
            resolve: {
              fileName: function() { return thing.fileDescriptor.getf('name') },
              protoFileContent: function() { return resp.data }
            }
          });
        },
        function(err){ console.log("GOT AN ERROR", err); }
      );
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
