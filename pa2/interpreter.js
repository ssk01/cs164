if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
  var desugarAST = require('./desugar.js').desugarAST;
  var env = require('./environment.js');
  var envRoot = env.root;
  var envExtend = env.extend;
  var envBind = env.bind;
  var envUpdate = env.update;
  var envLookup = env.lookup;
}

var interpret = function(asts, log, err) {
  // console.log('astsssssssssss', asts[0], log,err)
  console.log('env root  ', envRoot)
  var root = envRoot();
  root['*title'] = 'Root';

  // TODO: Complete the closure implementation. What's missing?
  function makeClosure(names, body,env) {
    return {
      names: names,
        body: body,
        type: 'closure',
        env:env,
    };
  }

  function evalBlock(t, env) {
    var last = null;
    t.forEach(function(n) {
      last = evalStatement(n, env);
    });
    return last;
  }
  
  function evalExpression(node, env){
    //TODO: Implement the expressions that aren't yet handled.
    switch (node.type){
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
        console.log('lambda make closure ',node)
        return makeClosure(node.arguments, node.body, env);
      case "call":
        var fn = evalExpression(node.function, env);
        if (fn.type && fn.type === 'closure') {
          // TODO: Perform a call. The code below will only work if there are
          // no arguments, so you'll have to fix it.  The crucial steps are:
          // 1. Extend the environment with a new frame --- see environment.js.
          // 2. Add argument bindings to the new frame.
          console.log('call fn  ',fn, 'node  ', node)
          
          newEnv = envExtend(fn.env)
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
        break;
      default:
        console.log('not match op')
    }
  }

  function evalStatement(node, env) {
    switch (node.type) {
      // TODO: Complete for statements that aren't handled
      case "def":
        envBind(env, node.name.name, evalExpression(node.value, env));
        console.log('def  .',node.name.name)
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
        throw new Error(
          "What's " + node.type + "? " + JSON.stringify(node)
      );
    }
  }

  var desugarOne = function(asts){
    var ast, remaining_asts;
    
    if (asts.length > 0){
      ast = asts.shift(); //pops first item
      remaining_asts = asts; //first item already popped
    }
    else{ return; } // no more ASTs to eval
    desugarAST(ast, function(ast) {
      try {
		console.log("per ast___:", ast, '  ', remaining_asts)
        evalBlock(ast, root);
        desugarOne(remaining_asts);
      } catch (e) {
        if (e.constructor === ExecError) {
          log('Error: ' + e.message);
        } else {
          throw e;
        }
      }
    });
  };
  console.log('nmb  desugar ', asts)
  desugarOne(asts);
};

// Makes the interpreter importable in Node.js
if (typeof(module) !== 'undefined') {
  module.exports = {
    'interpret': interpret
  };
}
