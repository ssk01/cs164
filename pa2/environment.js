if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
}

/* Creates a root environment. */
function envRoot() {
  return {
    // The root doesn't have a parent. The `*parent` symbol is illegal in our
    // language, and thus safe to bind.
    '*parent': null
  };
}

/* Extends the environment. */
function envExtend(parent) {
  // TODO: Add a new frame to the environment
	// newEnv = {'*parent': null}
	var newEnv = envRoot();
    newEnv['*parent'] = parent
    return newEnv
  // throw "Implement me!";
}

/* Binds a new value to the top frame. */
function envBind(frame, name, value) {
  // TODO: Define "name", which must be bound to "value"
    if (frame.hasOwnProperty(name)) {
		// log('dfadf')
		console.log('already envbind ', name, )
		var out = document.getElementById("out");
        out.innerText = "Error: "+name+ " is already declared"
      // ExecError("Error: "+name+ " is already declared".formatUnicorn({name:name}))
      	return
	} 
	console.log('envbind ', name, value)
    frame[name] = value
    // Error: x is already declared
    // throw "Implement me!";
}

/* Updates the value binding of a variable. */
function envUpdate(frame, name, value) {
  // TODO: Update the environment; variable "name" must be bound to "value"
    if (frame.hasOwnProperty(name)) {
      frame[name] = value
      return 
    } else {
      frame = frame['*parent']
      while (frame != null) {
        if (frame.hasOwnProperty(name)) {
            frame[name] = value
            return
        }
        frame = frame['*parent']
	  }
	  var out = document.getElementById("out");
	  out.innerText = "Error: "+name+ " is not declared"
    //   ExecError("Error: {name} is not declared".formatUnicorn({name:name}))
    }
  // consol
  // throw "Implement me!";
}

/* Looks up the value of a variable. */
function envLookup(frame, name) {
  // TODO: Lookup the value of "name" in "env" in the current and previous frames
  f = frame
  if (frame.hasOwnProperty(name)) {
    return frame[name];
  } else {
    frame = frame['*parent']
    while (frame != null) {
      if (frame.hasOwnProperty(name)) {
        return frame[name];
      }
      frame = frame['*parent']
    }
    console.log('can not found', name, f)
    throw "Implement me!";
  } 
}

if (typeof(module) !== 'undefined') {
  module.exports = {
    root: envRoot,
    extend: envExtend,
    bind: envBind,
    update: envUpdate,
    lookup: envLookup
  };
}
