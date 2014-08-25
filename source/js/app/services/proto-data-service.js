var pilgrimApp = angular.module('pilgrimApp'),
    PROTOS = [],
    PROTOS_BY_NAME = {},
    PACKAGES = [],
    Protob = require('protob').Protob;

pilgrimApp.factory('ProtoDataService', ['ProtoObject', '$http', '$modal', '$location', '$routeParams', '$rootScope',
  function(ProtoObject, $http, $modal, $location, $routeParams, $rootScope) {
    var $modalInstance = $modal.open({
      templateUrl: 'loadingModal.html',
      controller: LoadingModalCtrl,
      keyboard: false,
      backdrop: 'static'
    });

    var protoBundle, pbMatch;

    if( pbMatch = (window.location.search).match(/protoBundle=([^\s\&]+)/)) {
      protoBundle = decodeURIComponent(pbMatch[1]);
    } else {
      protoBundle = "http://localhost:9151/proto-bundle.json";
    }

    function LoadingModalCtrl($scope) { };

    function ErrorLoadingCtrl($scope, error) {
      $scope.error = error;
      $scope.protoBundle = protoBundle;
      $scope.newBundle = $scope.protoBundle;
    };

    console.time('starting');
    var registry = Protob.registry,
        promise = $http.get(protoBundle),
        Long = Protob.Long;

    promise = promise.success(
      // Success
      function(data, status, headers) {
        console.time('CompiledProtos');
        registry.register(data);
        console.timeEnd('CompiledProtos');

        function transformValue(val, field) {
          if(field.fieldType == 'TYPE_ENUM') {
            return val && val.name;
          } else if (field.fieldType == 'TYPE_MESSAGE') {
            return val.asJSONWithPackages();
          } else {
            if(val instanceof Long) val = val.toString();
            return val;
          }
        }

        if(headers('x-proto-path')) {
          $rootScope.protoSourceUrl = new URL(protoBundle);
          $rootScope.protoSourceUrl.pathname = headers('x-proto-path');
        }

        window.thing = $rootScope.protoSourceUrl;

        require('protob').Message.prototype.asJSONWithPackages = function() {
          var out = {},
              self = this;

          this.constructor.orderedFields.forEach(function(f) {
            if(self.isFieldSet(f.getf('number'))) {
              var name = [],
                  val = self.getf(f.getf('number'));

              if(f.pkg) name.push(f.pkg);
              name.push(f.getf('name'));
              name = name.join(".");
              if(f.repeated) {
                out[name] = val.map(function(v) { return transformValue(v,f); });
              } else {
                out[name] = transformValue(val, f);
              }
            }
          });
          return out;
        }

        console.time("PreparingApplication");
        registry.keys().forEach(function(k) {
          var proto = registry.lookup(k),
              fd = proto.fileDescriptor,
              po;

          if(!proto) return;
          if(!fd.getf) debugger;
          if(PACKAGES.indexOf(fd.getf('package')) < 0) PACKAGES.push(fd.getf('package'));

          po = ProtoObject.fromProto(proto);
          PROTOS.push(po);
          PROTOS_BY_NAME[po.fullName] = po;
        });

        PACKAGES.sort();
        console.timeEnd("PreparingApplication");
        console.timeEnd('starting');
        $modalInstance.dismiss('cancel');
        return PROTOS_BY_NAME;
      }
    )
    .catch(function(err) {
      if($modalInstance) $modalInstance.dismiss('cancel');
      $modalInstance = $modal.open({
        templateUrl: 'errorLoadingProtos.html',
        controller: ErrorLoadingCtrl,
        keyboard: false,
        backdrop: 'static',
        resolve: {
          error: function() { return err; }
        }
      });
    });
    return { promise: promise };
  }
]);

pilgrimApp.value('protos', PROTOS);
pilgrimApp.value('protosByName', PROTOS_BY_NAME);
pilgrimApp.value('packages', PACKAGES);
