pilgrimApp.filter('demodulize', function() {
  return function(input) {
    if(!input) return '';
    var parts = input.split('.');
    return parts[parts.length - 1];
  };
});

