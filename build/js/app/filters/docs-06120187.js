pilgrimApp.filter('markdown', ['$sce', function($sce) {
  return function(str) {
    var html = markdown.toHTML(str || '');
    return $sce.trustAsHtml(html);
  };
}]);
