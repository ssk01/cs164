'use strict';

if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
  var desugarAST = require('./desugar.js').desugarAST;
  var env = require('./environment.js');
  var Table = require('./table.js').Table;
  var envRoot = env.root;
  var envExtend = env.extend;
  var envBind = env.bind;
  var envUpdate = env.update;
  var envLookup = env.lookup;
}
var lo = console.log.bind(console)
var j = JSON.stringify
var interpret = function(asts, log, err) {

  var root = envRoot();
  root['*title'] = 'Root';

  // Returns a closure, a data structure which stores the param names
  // (id objects), the body of the function, and the referencing
  // environment, in which it was initialized --- (for lexical scoping).
  function makeClosure(names, body, env) {
    //TODO: Use your own makeClosure here
    return {
      names: names,
        body: body,
        type: 'closure',
        env:env,
    };
  }

  function to164Object(o) {
    // convert a Python object to a suitable 164 object
    var type = typeof o;
    if (type === 'number') {
      return o;
    } else if (type === 'string') {
      return o;
    } else {
      // throw new ExecError('converting unknown type')
      console.log('converting unknown type');
      return null;
    }
  }

  function toJSObject(o) {
    // convert a Python object to a suitable 164 object
    var type = typeof o;
    if (type === 'number') {
      return o;
    } else if (type === 'string') {
      return o;
    } else {
      // throw new ExecError('converting unknown type')
      console.log('converting unknown type');
      return null;
    }
  }

  function evalBlock(t, env) {
    var last = null;
    t.forEach(function(n) {
      last = evalStatement(n, env);
    });
    return last;
  }

  function evalExpression(node, env) {
    //T ODO: Use your own evalExpression here
    // keep the 'native' case below for using native JavaScript
    // introduce new cases as needed to implement dictionaries,
    // lists, and objects
    switch (node.type) {
      case 'native':
        var func = node.function.name;
        var args = node.arguments;

        var jsArgs = args.map(function(n) {
          return toJSObject(evalExpression(n, env));
        });
        var jsFunc = runtime[func];

        var ret = jsFunc.apply(null, jsArgs);
        return to164Object(ret);
      case '+':
      // console.log('are you ',aa)
        return evalExpression(node.operand1, env) + evalExpression(node.operand2, env);
      case '-':
      // console.log('are you ',aa)
        return evalExpression(node.operand1, env) - evalExpression(node.operand2, env);
      case '*':
      // console.log('are you ',aa)
        return evalExpression(node.operand1, env) * evalExpression(node.operand2, env);
      case '/':
      // console.log('are you ',aa)
        var rhs = evalExpression(node.operand2, env);
        if (rhs != 0){
          return evalExpression(node.operand1, env) / rhs;
        } else {
          return "Error: Division by zero";
        }
      case '>':
        if(evalExpression(node.operand1, env) > evalExpression(node.operand2, env)){
            return 1
        } else {
            return 0
        };
      case '<':
        if(evalExpression(node.operand1, env) < evalExpression(node.operand2, env)){
            return 1
        } else {
            return 0
        };
      case '<=':
        if(evalExpression(node.operand1, env) <=evalExpression(node.operand2, env)){
            return 1
        } else {
            return 0
        };
      case '>=':
      // console.log('are you ',aa)
        if(evalExpression(node.operand1, env) >= evalExpression(node.operand2, env)){
            return 1
        } else {
            return 0
        };
      case '!=':
        if(evalExpression(node.operand1, env) != evalExpression(node.operand2, env)){
            return 1
        } else {
            return 0
        };
      case '==':
        if(evalExpression(node.operand1, env) == evalExpression(node.operand2, env)){
            return 1
        } else {
            return 0
        };
      case "id":
        return envLookup(env, node.name);
      case "null":
        return null
      case "int-lit":
        return node.value;
      case "string-lit":
        return node.value;
      case "len":
        var table = evalExpression(node.dict, env)
        return table.get_length()
        
      case "empty-dict-lit":
        return new Table()
      case "type":
        // if (node.)
        // lo('type ',node)
        var obj = evalExpression(node.body, env);
        if(obj instanceof Table){
          return "table";
        }
        return "other";
      case "in":
        var key = evalExpression(node.operand1, env)
        var table = evalExpression(node.operand2, env)
        if (table.has_key(key)){
          return 1
        } else {
          return 0
        }

      case "get":
      lo('ger env ', env, node)
        var table = evalExpression(node.dict, env)
        lo('ok jb')
        var field = evalExpression(node.field, env)
        var res = table.get(field)        
        lo('res  ',res)
        return res
      case "ite":
        var cond = evalExpression(node.condition, env);
        var ct = evalExpression(node.true,  env);
        var cf = evalExpression(node.false, env);
        if (cond == null) {
          cond = false;
        }
        if ((typeof cond != 'boolean') && (typeof cond != 'number')) {
          throw new ExecError('Condition not a boolean');
        }
        console.log('cond, ', node.condition,cond)
        return cond ? ct : cf;
      case "lambda":
        console.log('lambda make closure ', JSON.stringify(node))
        return makeClosure(node.arguments, node.body, env);
      case "call":
        lo('call node', node)
        if (node.function.name == 'type') {
          var asts = {
            body: node.arguments[0],
            type:'type',
          }
          return evalExpression(asts, env)
        }
        var fn = evalExpression(node.function, env);
                
        console.log('call fn  ',fn, 'node  ', node)
        if (fn.type && fn.type === 'closure') {
          // TODO: Perform a call. The code below will only work if there are
          // no arguments, so you'll have to fix it.  The crucial steps are:
          // 1. Extend the environment with a new frame --- see environment.js.
          // 2. Add argument bindings to the new frame.
          
          var newEnv = envExtend(fn.env)
          if (node.arguments.length == fn.names.length){
            console.log('ok  jb', )
            for (var i = 0; i < node.arguments.length; i++){
              envBind(newEnv,  fn.names[i].name, evalExpression(node.arguments[i], env))
            }
          }
          console.log('new env here ', newEnv)
          return evalBlock(fn.body, newEnv);
        } else {
          throw new ExecError('Trying to call non-lambda');
        }
      default:
        console.log('not match op expression', j(node))
        throw new Error(
          "What's " + node.type + "? " + JSON.stringify(node)
      );
    }
  }

  function evalStatement(node, env) {
    //T ODO: Use your own evalStatement here
    // introduce new cases as needed to implement dictionaries,
    // lists, and objects
    switch (node.type) {
      case "def":
      envBind(env, node.name.name, evalExpression(node.value, env));
      console.log('def  .',node.name.name)
      return null;
    case "put":
        lo('put env ', env, node)
        var table = evalExpression(node.dict, env)
        lo('ok jb')
        var field = evalExpression(node.field, env)
        var value = evalExpression(node.value, env)
        table.put(field, value)
        return null;
    case "print":
      // console.log(evalExpression(node.value, env))
      log(evalExpression(node.value, env));
      return null;
    case "error":
      throw new ExecError(evalExpression(node.message, env));
    case "exp":
      return evalExpression(node.body, env);
    case "asgn":
    // {
    //   "type": "asgn", 
    //   "name": {
    //     "type": "id", 
    //     "name": "x"
    //   }, 
    //   "value": {
    //     "type": "int-lit", 
    //     "value": 2
    //   }
       envUpdate(env, node.name.name, evalExpression(node.value, env));
      return null
    default:
      lo('error ', node)
      throw new Error(
        "What's " + node.type + "? " + JSON.stringify(node)
    );
    }
  }

  function desugarAll(remaining, desugared, callback) {
    if (remaining.length == 0) {
      setTimeout(function () {
        callback(desugared);
      }, 0);
      return;
    }

    var head = remaining.shift();
    desugarAST(head, function(desugaredAst) {
      desugared.push(desugaredAst);
      desugarAll(remaining, desugared, callback);
    });
  }

  desugarAll(asts, [], function(desugaredAsts) {
    lo('ast ', asts[0])
    lo("desugaredAsts ", desugaredAsts)
    for (var i = 0, ii = desugaredAsts.length; i < ii; ++i) {
      try {
        evalBlock(desugaredAsts[i], root);
      } catch (e) {
        if (e instanceof ExecError) {
          log('Error: ' + e.message);
        } else {
          throw e;
        }
      }
    }
  });
};

if (typeof(module) !== 'undefined') {
  module.exports = {
    'interpret': interpret
  };
}
