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

