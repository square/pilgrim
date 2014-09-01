require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"duplexer":[function(require,module,exports){
var Stream = require("stream")
var writeMethods = ["write", "end", "destroy"]
var readMethods = ["resume", "pause"]
var readEvents = ["data", "close"]
var slice = Array.prototype.slice

module.exports = duplex

function forEach (arr, fn) {
    if (arr.forEach) {
        return arr.forEach(fn)
    }

    for (var i = 0; i < arr.length; i++) {
        fn(arr[i], i)
    }
}

function duplex(writer, reader) {
    var stream = new Stream()
    var ended = false

    forEach(writeMethods, proxyWriter)

    forEach(readMethods, proxyReader)

    forEach(readEvents, proxyStream)

    reader.on("end", handleEnd)

    writer.on("drain", function() {
      stream.emit("drain")
    })

    writer.on("error", reemit)
    reader.on("error", reemit)

    stream.writable = writer.writable
    stream.readable = reader.readable

    return stream

    function proxyWriter(methodName) {
        stream[methodName] = method

        function method() {
            return writer[methodName].apply(writer, arguments)
        }
    }

    function proxyReader(methodName) {
        stream[methodName] = method

        function method() {
            stream.emit(methodName)
            var func = reader[methodName]
            if (func) {
                return func.apply(reader, arguments)
            }
            reader.emit(methodName)
        }
    }

    function proxyStream(methodName) {
        reader.on(methodName, reemit)

        function reemit() {
            var args = slice.call(arguments)
            args.unshift(methodName)
            stream.emit.apply(stream, args)
        }
    }

    function handleEnd() {
        if (ended) {
            return
        }
        ended = true
        var args = slice.call(arguments)
        args.unshift("end")
        stream.emit.apply(stream, args)
    }

    function reemit(err) {
        stream.emit("error", err)
    }
}

},{"stream":undefined}],"react-fender":[function(require,module,exports){
/** @jsx React.DOM */

var fieldComponents = {},
    Message,
    LONG_REG = /64$/,
    INT_REG = /(INT|FIXED)/,
    UINT_REG = /(UINT|[^S]FIXED)/;

function addDocsPopover(field, opts) {
  var doc = field.getf('doc');
  if(!doc) return opts;
  opts["data-toggle"] = "popover";
  opts["data-trigger"] = "focus";
  opts["data-placement"] = "right";
  opts["data-content"] = doc;
  return opts;
}

function activatePopup(field) {
  if(!jQuery) return;

  setTimeout(function() {
    var wrapped = jQuery(this.refs[field.getf('number')].getDOMNode());
    if(wrapped.popover) wrapped.popover();
  }.bind(this), 100);
}

function fieldData(field) {
  var data = {
        id: field.getf('number'),
        name: field.getf('name'),
        doc: field.getf('doc')
      },
      fieldOpts = field.getf('options'),
      fenderOpts;

  if(fieldOpts && (fenderOpts = fieldOpts.getf('fender_field', 'fender.v1'))) {
    var opts = fenderOpts.asJSON();
    Object.keys(opts).forEach(function(key) {
      data[key] = opts[key];
    });
  }

  return data;
}

function wrapField(field, name, isRequired, child, remover, errorComponent, isError) {
  var removeButton;
  if(remover) {
    removeButton = ( React.DOM.button({className: "remover", onClick: remover}, "X") );
  } else {
    removeButton = ( React.DOM.span(null) );
  }

  return (
    React.DOM.div({className: "proto-field form-group" + isError, 'data-error': errorComponent}, 
      removeButton, 
      React.DOM.label({className: "control-label"}, requiredMarker(isRequired), " ", name), 
      child
    )
  );
}

function requiredMarker(isRequired) {
  return (isRequired ? ( React.DOM.span({className: "required"}, "*") ) : ( React.DOM.span(null) ) );
}

var StringField = React.createClass({displayName: 'StringField',
  getInitialState: function() {
    return { textarea: !!this.props.field.displayAsTextArea };
  },
  componentDidMount: function() {
    activatePopup.call(this, this.props.field);
  },
  provideValue: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value;
    val = this.props.field.coerce({}, val)
    if(this.props.setMessageValue) this.props.setMessageValue(val);
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        message = this.props.message,
        value = this.props.value,
        required = !!(field.required || data.present),
        child;

    opts = {
      className: "form-control",
      ref: data.id,
      placeholder: data.name,
      onChange: this.provideValue,
      required: required
    };

    addDocsPopover(field, opts);

    if(this.state.textarea) {
      opts.children = value;
      child = new React.DOM.textarea(opts);
    } else {
      opts.type = "text";
      opts.value = value;
      child = new React.DOM.input(opts);
    }
    return child;
  }
});

var NumericField = React.createClass({displayName: 'NumericField',
  getInitialState: function() {
    return { value: this.props.value && this.props.value.toString() };
  },
  componentDidMount: function() {
    activatePopup.call(this, this.props.field);
  },
  storeState: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value;
    this.setState( { value: val } );
  },
  provideValue: function() {
    if(this.props.setMessageValue) this.props.setMessageValue(this.props.field.coerce({}, this.state.value));
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        value = this.state.value,
        type = field.fieldType,
        required = !!(field.required || data.present),
        isLong = LONG_REG.test(type),
        isInt = INT_REG.test(type),
        isUint = UINT_REG.test(type),
        opts = {
          type: "number",
          ref: data.id
        };

    if(data.hasOwnProperty('max')) opts.max = data.max;
    if(data.hasOwnProperty('min')) opts.min = data.min;
    if(value && value.toString) value = value.toString(); // handle longs

    opts.value = value;
    if(isUint && !data.min) opts.min = 0;

    if(isInt) {
      opts.step = 1;
    } else {
      opts.step = "any";
    }

    opts.onBlur = this.provideValue;
    opts.onChange = this.storeState;
    opts.className = "form-control";

    addDocsPopover(field, opts);

    return new React.DOM.input(opts);
  }
});

var EnumField = React.createClass({displayName: 'EnumField',
  provideValue: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value;
    if(!val) {
      val = undefined;
    } else {
      val = this.props.field.coerce({}, val);
    }
    if(this.props.setMessageValue) this.props.setMessageValue(val);
  },
  componentDidMount: function() {
    activatePopup.call(this, this.props.field);
    // Have to take into account what happens when the field is required but no default is supplied
    var val = this.refs[this.props.field.getf('number')].getDOMNode().value,
        enumValue = this.props.value && this.props.value.name;

    if(val != enumValue) this.provideValue();
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        value = this.props.value,
        required = !!(field.required || data.present),
        fullName = field.concrete.fullName,
        names = Object.keys(field.concrete.v),
        options = [];

    if(value) value = value.name || value;
    if(!required) options.push( ( React.DOM.option({key: "not-set"}) ));

    names.forEach(function(name) {
      var key = fullName + '.' + name;
      options.push( ( React.DOM.option({value: name, key: name}, name) ) );
    });

    var selectOptions = {
      ref: data.id,
      value: value,
      onChange: this.provideValue,
      children: options
    };

    addDocsPopover(field, selectOptions);

    return new React.DOM.select(selectOptions);
    // return ( <select ref={data.id} value={value} onChange={this.provideValue}>{options}</select> );
  }
});

var BoolField = React.createClass({displayName: 'BoolField',
  provideValue: function() {
    var val = this.refs[this.props.field.getf('number')].getDOMNode().checked;
    val = this.props.field.coerce({}, val)
    if(this.props.setMessageValue) this.props.setMessageValue(val);
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        value = !!this.props.value,
        required = !!(field.required || data.present),
        opts = {
          className: "form-control",
          ref: data.id,
          type: "checkbox",
          value: "true",
          checked: value,
          onChange: this.provideValue
        };

    addDocsPopover(field, opts);

    return new React.DOM.input(opts);
  }
});

var MessageField = React.createClass({displayName: 'MessageField',
  getInitialState: function() {
    return { msg: this.props.value };
  },
  remove: function() {
    var field = this.props.field;
    if(this.props.setMessageValue) this.props.setMessageValue(undefined);
    this.setState({msg: undefined});
  },
  createNew: function() {
    var field = this.props.field,
        concrete = field.descriptor.concrete,
        msg = new concrete();

    if(this.props.setMessageValue) this.props.setMessageValue(msg);
    this.setState({msg: msg});
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        msg = this.state.msg,
        required = !!(field.required || data.present);

    if(!msg) {
      return ( React.DOM.button({className: "btn btn-primary btn-xs", onClick: this.createNew}, "+") );
    } else {
      return ( 
        React.DOM.span(null, 
          React.DOM.button({className: "btn btn-priary btn-xs", onClick: this.remove}, "-"), 
          Message({message: msg, remover: this.props.remover})
        )
      );
    }
  }
});

var BytesField = React.createClass({displayName: 'BytesField',
  render: function() {
    return ( React.DOM.span({className: "not-supported"}, "Bytes fields not supported") );
  }
});

[
  "TYPE_DOUBLE", "TYPE_FLOAT", "TYPE_INT32", "TYPE_INT64", "TYPE_UINT32", "TYPE_UINT64", "TYPE_FIXED32",
  "TYPE_FIXED64", "TYPE_SFIXED32", "TYPE_SFIXED64", "TYPE_SINT32", "TYPE_SINT64"
].forEach(function(type) {
  fieldComponents[type] = NumericField;
});

fieldComponents.TYPE_STRING = StringField;
fieldComponents.TYPE_ENUM = EnumField;
fieldComponents.TYPE_BOOL = BoolField;
fieldComponents.TYPE_MESSAGE = MessageField;
fieldComponents.TYPE_BYTES = BytesField;

var SingleField = React.createClass({displayName: 'SingleField',
  render: function() {
    if(!this.props.field) return (React.DOM.span(null));
    var data = fieldData(this.props.field),
        required = !!(data.required || data.present),
        child, setMessageValue,
        error = this.props.error,
        isError, errorComponent;

    setMessageValue = function(val) {
      this.props.message.setf(val, this.props.field.getf('number'));
      this.setState({ time: new Date().valueOf() });
    }.bind(this);

    if(error && error.error_types && error.error_types.length) {
      errorComponent = error.error_types.join(',');
      isError = "validation-error";
    } else {
      errorComponent = null;
      isError = '';
    }

    child = new fieldComponents[this.props.field.fieldType]( {
      field: this.props.field,
      value: this.props.message.getf(this.props.field.getf('number')),
      message: this.props.message,
      setMessageValue: setMessageValue,
      error: this.props.error
    });

    return wrapField(this.props.field, data.name, required, child, this.props.remover, errorComponent, isError);
  }
});

var RepeatedField = React.createClass({displayName: 'RepeatedField',
  addNew: function() {
    var field = this.props.field,
        message = this.props.message,
        children = this.props.value,
        value;

    if(field.fieldType == "TYPE_MESSAGE") value = new field.descriptor.concrete();

    value = value || '';
    value.key = new Date().valueOf();
    children.push(value);

    this.setState({ time: new Date().valueOf() });
  },
  render: function() {
    var field = this.props.field,
        data = fieldData(field),
        fieldComponent = fieldComponents[field.fieldType],
        repeated = this.props.field.repeated,
        values = this.props.value,
        required = !!(field.required || data.preset),
        self = this,
        children = [],
        error = this.props.error,
        isError, errorComponent;

    values.forEach(function(val, i) {
      var remover = function() {
        var oldState = this.props.value;

        oldState.splice(i, 1);
        this.setState({time: new Date().valueOf()});
      }.bind(this);

      var setValue = function(val) {
        var oldState = this.props.value;
        oldState[i] = val;
        this.setState({time: new Date().valueOf()});
      }.bind(this);

      children.push(
        new fieldComponent({
          field: field,
          value: val,
          remover: remover,
          key: val.key,
          setMessageValue: setValue
        })
      );
    }.bind(this));

    if(error && error.error_types && error.error_types.length) {
      errorComponent = error.error_types.join(',');
      isError = "validation-error";
    } else {
      errorComponent = null;
      isError = '';
    }

    return (
      React.DOM.div({className:  "proto-field " + (isError || ''), 'data-errors': errorComponent}, 
        React.DOM.label({className: "control-label"}, requiredMarker(required), " ", data.name, " ", React.DOM.span({className: "add-new", onClick: this.addNew}, "+")), 
        React.DOM.fieldset({className: "proto-field"}, 
          children
        )
      )
    );
  }
});

var Field = React.createClass({displayName: 'Field',
  render: function() {
    if(!this.props.field) return (React.DOM.span(null));
    var data = fieldData(this.props.field),
        repeated = this.props.field.repeated,
        value = this.props.message.getf(data.id);

    if(repeated) {
      return new RepeatedField({field: this.props.field, value: value, remover: this.props.remover, message: this.props.message, error: this.props.error});
    } else {
      return new SingleField({field: this.props.field, value: value, remover: this.props.remover, message: this.props.message, error: this.props.error});
    }
  }
});

var Message = React.createClass({displayName: 'Message',
  render: function() {
    var message = this.props.message;
    if(!message) return (React.DOM.div({className: "Message"}, "No Class"));
    if(!message.isMessage()) return (React.DOM.div({className: "Message"}, "Not a message"));

    var children = [],
        fieldErrors = {};

    ((this.props.errors && this.props.errors.errors) || []).forEach(function(error) {
      var errorKey = [error.field.name, error.field.package].join("#");
      fieldErrors[errorKey] = error;
    });

    message.constructor.orderedFields.forEach(function(field, i) {
      var fieldName = field.getf('name'),
          fieldId = field.getf('number'),
          key = message.constructor.fullName + fieldName + fieldId,
          error = fieldErrors[[fieldName, field.package].join('#')];

      children.push(new Field({ field: field, message: message, key: key, error: error}));
    });

    var removeButton;
    if(this.props.remover) {
      removeButton = ( React.DOM.button({className: "remover", onClick: this.props.remover}, "X") );
    } else {
      removeButton = ( React.DOM.span(null) );
    }

    return (
      React.DOM.fieldset({className: "Message"}, 
        removeButton, 
        children
      )
    );
  }
});

var MessageForm = React.createClass({displayName: 'MessageForm',
  getInitialState: function() {
    return { errors: undefined };
  },
  handleSubmit: function($event) {
    $event.preventDefault();
    var validation;
    if(this.props.message.fenderValidate) {
      validation = this.props.message.fenderValidate().asJSON();
      if(!validation.valid) {
        this.setState({errors: validation});
        if(this.props.onSubmit) this.props.onSubmit(validation);
        return;
      } else {
        this.setState({errors: undefined});
      }
    }

    if(this.props.onSubmit) this.props.onSubmit(null, this.props.message);
    return false;
  },
  render: function() {
    var msg = this.props.message;

    return (
      React.DOM.form({onSubmit: this.handleSubmit, className: "messageForm", role: "form"}, 
        Message({message: msg, errors: this.state.errors}), 
        React.DOM.input({type: "submit", className: "form-control btn btn-success submit", value: "Go"})
      )
    );
  }
});

if(typeof window != undefined) {
  window.ReactFenderMessageForm = MessageForm;
} 
if(typeof module != undefined ) {
  module.exports = MessageForm;
}


},{}],"through":[function(require,module,exports){
var Stream = require('stream')

// through
//
// a stream that does nothing but re-emit the input.
// useful for aggregating a series of changing but not ending streams into one stream)

exports = module.exports = through
through.through = through

//create a readable writable stream.

function through (write, end, opts) {
  write = write || function (data) { this.queue(data) }
  end = end || function () { this.queue(null) }

  var ended = false, destroyed = false, buffer = [], _ended = false
  var stream = new Stream()
  stream.readable = stream.writable = true
  stream.paused = false

//  stream.autoPause   = !(opts && opts.autoPause   === false)
  stream.autoDestroy = !(opts && opts.autoDestroy === false)

  stream.write = function (data) {
    write.call(this, data)
    return !stream.paused
  }

  function drain() {
    while(buffer.length && !stream.paused) {
      var data = buffer.shift()
      if(null === data)
        return stream.emit('end')
      else
        stream.emit('data', data)
    }
  }

  stream.queue = stream.push = function (data) {
//    console.error(ended)
    if(_ended) return stream
    if(data == null) _ended = true
    buffer.push(data)
    drain()
    return stream
  }

  //this will be registered as the first 'end' listener
  //must call destroy next tick, to make sure we're after any
  //stream piped from here.
  //this is only a problem if end is not emitted synchronously.
  //a nicer way to do this is to make sure this is the last listener for 'end'

  stream.on('end', function () {
    stream.readable = false
    if(!stream.writable && stream.autoDestroy)
      process.nextTick(function () {
        stream.destroy()
      })
  })

  function _end () {
    stream.writable = false
    end.call(stream)
    if(!stream.readable && stream.autoDestroy)
      stream.destroy()
  }

  stream.end = function (data) {
    if(ended) return
    ended = true
    if(arguments.length) stream.write(data)
    _end() // will emit or queue
    return stream
  }

  stream.destroy = function () {
    if(destroyed) return
    destroyed = true
    ended = true
    buffer.length = 0
    stream.writable = stream.readable = false
    stream.emit('close')
    return stream
  }

  stream.pause = function () {
    if(stream.paused) return
    stream.paused = true
    return stream
  }

  stream.resume = function () {
    if(stream.paused) {
      stream.paused = false
      stream.emit('resume')
    }
    drain()
    //may have become paused again,
    //as drain emits 'data'.
    if(!stream.paused)
      stream.emit('drain')
    return stream
  }
  return stream
}


},{"stream":undefined}]},{},[]);
