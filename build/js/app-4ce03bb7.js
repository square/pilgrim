pilgrimModels = angular.module('pilgrimModels', []);

pilgrimApp = angular.module('pilgrimApp', [
  'ngRoute',
  'ui.bootstrap',
  'pilgrimModels'
]);

var MESSAGE = 'message',
    SERVICE = 'service',
    ENUM = 'enum',
    typeToWrapper = {
      message: ProtoMessage,
      service: ProtoService,
      'enum':  ProtoEnum,
    };

var pilgrimModels = angular.module('pilgrimModels');

var camelCaser = (function() {
  var DEFAULT_REGEX = /[-_]+(.)?/g;

  function toUpper(match, group1) {
      return group1 ? group1.toUpperCase() : '';
  }
  return function (str, delimiters) {
      return str.replace(delimiters ? new RegExp('[' + delimiters + ']+(.)?', 'g') : DEFAULT_REGEX, toUpper);
  }
})();


function toTitleCase(str) {
  return str.replace(/(?:^|\s)\w/g, function(match) {
    return match.toUpperCase();
  });
}

// A wrapper object to provide a consistent api beteween the things
function ProtoObject(protoObject) {
  if(!protoObject) return;
  this.protoObject = protoObject;
  this.name = protoObject.clazz;
  this.fullName = protoObject.fullName;
  this.fileDescriptor = protoObject.fileDescriptor;
  this.package = protoObject.fileDescriptor.getf('package');
  this.dependencies = this.fileDescriptor.getf('dependency');
  if(this.dependencies) this.dependencies.sort();
}

ProtoObject.fromProto = function(protoObj) {
  if(!protoObj) return;
  return new typeToWrapper[ProtoObject.objectType(protoObj)](protoObj)
}

ProtoObject.objectType = function(protoObj) {
  var type;
  if(!protoObj) return undefined;
  type = protoObj.type.name || protoObj.type
  switch(type) {
    case 'TYPE_MESSAGE': return MESSAGE;
    case 'TYPE_ENUM': return ENUM;
    case 'SERVICE': return SERVICE;
  };
}

ProtoObject.prototype.javaClassPath = function() {
  if(this._javaClassPath) return this._javaClassPath;
  this._javaClassPath = this.calculateJavaClassPath();
  return this._javaClassPath;
}

ProtoObject.prototype.calculateJavaClassPath = function() {
  var obj = this.protoObject,
      fd = obj.fileDescriptor,
      opts = fd.getf('options');

  if(!opts || !(jp = opts.getf('java_package'))) return;

  var jp = opts.getf('java_package'),
      parts = [jp],
      relativePath = this.fullName.substr(fd.getf('package').length + 1, this.fullName.length),
      camelFileName;

  if(opts.getf('java_outer_classname')) {
    parts.push(opts.getf('java_outer_classname'));
  } else if (!opts.getf('java_multiple_files')) {
    var pathParts = fd.getf('name').split("/");
    camelFileName = camelCaser(pathParts[pathParts.length - 1].replace(/\.proto$/, ''));
    parts.push(toTitleCase(camelFileName));
  }

  parts.push(relativePath);
  return parts.join(".");
};

function ProtoMessage(protoObject) {
  ProtoObject.call(this, protoObject);
  this.type = MESSAGE;
  this.isMessage = true;
  this.glyphs = "glyphicon glyphicon-envelope";
}
function ProtoService(protoObject) {
  ProtoObject.call(this, protoObject);
  this.type = SERVICE;
  this.isService = true;
  this.glyphs = "glyphicon glyphicon-cloud";
}
function ProtoEnum(protoObject) {
  ProtoObject.call(this, protoObject);
  this.type = ENUM;
  this.isEnum = true;
  this.glyphs = "glyphicon glyphicon-list";
  this.values = _.values(protoObject.v);

  this.values.sort(function(v1, v2) {
    if(v1.number < v2.number) return -1;
    if(v1.number > v2.number) return 1;
    return 0;
  });
}

ProtoMessage.prototype = new ProtoObject();
ProtoService.prototype = new ProtoObject();
ProtoEnum.prototype    = new ProtoObject();

pilgrimModels.factory('ProtoObject', function() { return ProtoObject });
pilgrimModels.factory('ProtoMessage', function() { ProtoMessage });
pilgrimModels.factory('ProtoService', function() { ProtoService });
pilgrimModels.factory('ProtoEnum',    function() { ProtoEnum });
pilgrimApp.controller('EnumCtrl', ['$scope',
  function($scope) {
    $scope.$watch('activeTab', function() {
      $scope.enumProto = $scope.activeTab.protoObject;
    });
  }
]);
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
var pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('NoopCtrl', function() {});
var  pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('ObjectListCtrl', ['$scope', '$location', 'protos', '$log', '$element',
  function($scope, $location, protos, $log, $element) {
    $scope.protos = protos;

    $scope.$watch('searchFocusEvent', function() {
      var $objs = $('#scoped-objects input.search-bar');
      if(!$objs.has(':focus').length) {
        $objs.focus();
        $scope.searchFocusEvent && $scope.searchFocusEvent.preventDefault && $scope.searchFocusEvent.preventDefault();
      }
    });

    $scope.$watch('toggleServices', function() {
      $scope.query.scopedFilter.service = !$scope.query.scopedFilter.service;
    });

    $scope.$watch('toggleEnums', function() {
      $scope.query.scopedFilter.enum = !$scope.query.scopedFilter.enum;
    });

    $scope.$watch('toggleMessages', function() {
      $scope.query.scopedFilter.message = !$scope.query.scopedFilter.message;
    });

    $scope.$watch('query.search', _.debounce(function() {
      $scope.$apply(function() {
        $scope.query.objectQuery = $scope.query.search;
      });
    }, 250));
  }
]);

pilgrimApp.controller('ServiceCtrl', ['$scope',
  function($scope) {
  }
]);

pilgrimApp.controller('ServiceCtrl', ['$scope',
  function($scope) {
    $scope.$watch('activeTab', function() {
      $scope.service = $scope.activeTab.protoObject;
    });
  }
]);
var pilgrimApp = angular.module('pilgrimApp');

pilgrimApp.controller('TabCtrl', ['$scope', '$routeParams', 'protosByName',
  function($scope, $routeParams, protosByName) {
    var name = $routeParams.fullProtoName,
        proto = protosByName[name];

    $scope.setCurrentTab(proto);
  }
]);
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
pilgrimApp.filter('demodulize', function() {
  return function(input) {
    if(!input) return '';
    var parts = input.split('.');
    return parts[parts.length - 1];
  };
});

pilgrimApp.filter('displayValue', function() {
  return function(val) {
    if(val === undefined || val === null) return '';
    return val;
  };
});
pilgrimApp.filter('markdown', ['$sce', function($sce) {
  return function(str) {
    var html = markdown.toHTML(str || '');
    return $sce.trustAsHtml(html);
  };
}]);
pilgrimApp.filter('endsAfter', function() {
  return function(str, prefix) {
    if(!prefix) return str;
    if(str.indexOf(prefix) == 0) {
      return str.slice(prefix.length, str.length);
    } else {
      return str;
    }
  };
});
pilgrimApp.filter('protoByType', function() {
  return function(protoList, theFilter) {
    return _.filter(protoList, function(p) { return theFilter[p.type]; });
  };
});
pilgrimApp.filter('typeAsString', function() {
  return function(field, package) {
    var fullName;
    if(!field) return '';
    if(field.concrete || field.fullName) {
      fullName = field.fullName || field.concrete.fullName
      var packageParts = package.split("."),
          nameParts = fullName.split(".");
      for(var i=0; i < packageParts.length; i++) {
        if(nameParts[0] == packageParts[i]) {
          nameParts.shift();
        } else {
          break;
        }
      }
      return nameParts.join(".");
    } else {
      return field.fieldType.replace(/^TYPE_/, '').toLowerCase();
    }
  };
});
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
pilgrimApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider, $modal) {
    $routeProvider
      .when("/protos/:fullProtoName", {
        templateUrl: 'noop.html',
        controller: "TabCtrl",
        resolve:  {
          dataService: function(ProtoDataService) { return ProtoDataService.promise }
        }
      })
      .otherwise({
        templateUrl: 'noop.html',
        controller: 'NoopCtrl',
        resolve:  {
          dataService: function(ProtoDataService) { return ProtoDataService.promise }
        }
      })

    $locationProvider
      .html5Mode(false)
      .hashPrefix('!');
  }
]);




