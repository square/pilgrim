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
