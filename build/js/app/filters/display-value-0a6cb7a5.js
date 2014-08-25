pilgrimApp.filter('displayValue', function() {
  return function(val) {
    if(val === undefined || val === null) return '';
    return val;
  };
});
