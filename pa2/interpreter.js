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
  function makeClosure(names, body) {
    return {
      names: names,
        body: body,
        type: 'closure'
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
        return evalExpression(node.operand1, env) / evalExpression(node.operand2, env);
      case "id":
        return envLookup(env, node.name);
      case "int-lit":
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
        return cond ? ct : cf;
      case "lambda":
        console.log('lambda  ',node)
        return makeClosure(node.arguments, node.body);
      case "call":
        var fn = evalExpression(node.function, env);
        if (fn.type && fn.type === 'closure') {
          // TODO: Perform a call. The code below will only work if there are
          // no arguments, so you'll have to fix it.  The crucial steps are:
          // 1. Extend the environment with a new frame --- see environment.js.
          // 2. Add argument bindings to the new frame.
          console.log('call fn  ',fn)

          newEnv = envExtend(env)
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
        return null;
      case "print":
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
		console.log("per ast", ast )
        evalBlock(ast, root);
        desugarOne(remaining_asts);
      } catch (e) {
        if (e.constructor === ExecError) {
          log('Error: 1' + e.message);
        } else {
          throw e;
        }
      }
    });
  };
  console.log('nmb  desugar ', asts[0])
  desugarOne(asts);
};

// Makes the interpreter importable in Node.js
if (typeof(module) !== 'undefined') {
  module.exports = {
    'interpret': interpret
  };
}
