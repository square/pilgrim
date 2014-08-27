pilgrimApp.filter('markdown', ['$sce', function($sce) {
  return function(str) {
    str = str || '';
    var html = markdown.toHTML(str.replace(/\n/g, "\n\n"));
    return $sce.trustAsHtml(html);
  };
}]);
