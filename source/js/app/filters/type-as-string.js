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
