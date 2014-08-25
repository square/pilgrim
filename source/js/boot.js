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
