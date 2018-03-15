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
          console.log('already envbind ', name, )
          var out = document.getElementById("out");
      throw new ExecError("is already declared")
      } 
      // console.log('envbind ', name, value)
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
      throw new ExecError(name + " is not declared");
    }
    // throw "Implement me!";
  }
  
  /* Looks up the value of a variable. */
  function envLookup(frame, name) {
    // TODO: Lookup the value of "name" in "env" in the current and previous frames
    f = frame
    if (frame.hasOwnProperty(name)) {
      // console.log('frame father ',name,frame[name])
      
      return frame[name];
    } else {
      frame = frame['*parent']
      while (frame != null) {
        if (frame.hasOwnProperty(name)) {
          // console.log('frame father ', name, frame, frame[name])
          return frame[name];
        }
        frame = frame['*parent']
      }
      throw new ExecError(name + " is not declared");
     
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
  