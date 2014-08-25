pilgrimApp.filter('protoByType', function() {
  return function(protoList, theFilter) {
    return _.filter(protoList, function(p) { return theFilter[p.type]; });
  };
});
