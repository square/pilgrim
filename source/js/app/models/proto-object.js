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
