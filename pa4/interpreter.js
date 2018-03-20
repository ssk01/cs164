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
  // PA4: Bytecode interpreter.  Motivation: stackful interpreter
  // cannot implement coroutines.
  var root = envRoot();
  root['*title'] = 'Root';
  function makeClosure(names, body, env) {
    //TODO: Use your own makeClosure here
    return {
      names: names,
        body: body,
        type: 'closure',
        env:env,
    };
  }
  function compileToBytecode(ast) {
    // TODO step 2: Complete this function, which takes an AST as input
    // and produces bytecode as its output
	  
    // This helper function generates a unique register name
    function uniquegen() {
      return '#btc-reg-' + uniquegen.counter++;
    }
    uniquegen.counter = 1;
    function expnode(node, target, btc) {
      switch (node.type) {
        case 'int-lit':
          btc.push({"type":"int-lit","value":node.value,"target": target})
          break
        case '+':
          var reg1 = uniquegen()
          expnode(node.operand1, reg1, btc)
          var reg2 = uniquegen()
          expnode(node.operand2, reg2, btc)
          btc.push({"type":"+","operand1":reg1,"operand2":reg2,"target":target})
          break
        case '-':
          var reg1 = uniquegen()
          expnode(node.operand1, reg1, btc)
          var reg2 = uniquegen()
          expnode(node.operand2, reg2, btc)
          btc.push({"type":"-","operand1":reg1,"operand2":reg2,"target":target})
          break
        case '*':
          var reg1 = uniquegen()
          expnode(node.operand1, reg1, btc)
          var reg2 = uniquegen()
          expnode(node.operand2, reg2, btc)
          btc.push({"type":"*","operand1":reg1,"operand2":reg2,"target":target})
          break
        case '/':
            var reg1 = uniquegen()
            expnode(node.operand1, reg1, btc)
            var reg2 = uniquegen()
            expnode(node.operand2, reg2, btc)
            btc.push({"type":"/","operand1":reg1,"operand2":reg2,"target":target})
        case 'id':
          btc.push({"type":"id","name":node.name ,"target":target})
          break

          break
        case 'ite':
          var cond = uniquegen()
          var ct = uniquegen()
          var cf = uniquegen()
          expnode(node.cond, cond, btc)
          expnode(node.true, ct, btc)
          expnode(node.false, cf, btc)
          btc.push({"type":'ite', "condition":cond, "true":ct, "false":cf})
          break
        case 'lambda':
          // [{"type":"lambda","arguments":[{"type":"id","name":"y"}],"target":"#btc-reg-2","body":[
          btc.push({"type":"lambda","arguments":node.arguments, "target":target, "body":btcblock(node.body)})
          break
        case 'call':
        // call node  {"function":{"type":"id","name":"fun"},"type":"call","arguments":[{"type":"int-lit","value":0}]}
//         {"type":"id","name":"fun","target":"#btc-reg-14"},
// {"type":"int-lit","value":0,"target":"#btc-reg-15"},
// {"type":"call","function":"#btc-reg-14","arguments":["#btc-reg-15"],"target":"#btc-reg-13"},
          var func = uniquegen()
          expnode(node.function, func, btc)
          var args = []
          for (var arg of node.arguments) {
            var a = uniquegen()
            lo('arg  . ', arg)
            expnode(arg, a, btc)
            args.push(a)
          }
          var code ={"type":"call","function":func,"arguments":args,"target":target}
          btc.push(code)
          lo('call node ', j(code))
          break
        default:
          lo('default expnode error', node)
          throw new ExecError('wtfff ')
      }
    }
    function btcnode(node, target, btc) {
      lo('node, ', node)
      switch (node.type) {
        //TODO step 2: Handle every type of AST node you might receive!
        // {"type":"int-lit","value":1,"target":"#btc-reg-6"},
        // {"type":"int-lit","value":2,"target":"#btc-reg-7"},
        // {"type":"+","operand1":"#btc-reg-6","operand2":"#btc-reg-7","target":"#btc-reg-5"},
        case  'exp':
            expnode(node.body, target, btc)
            break;
        case 'def':
            var value = uniquegen()
            expnode(node.value, value, btc)
            // expnode(node.body, target)
            btc.push({"type":"def","name":node.name.name,"value": value, "target":target})
            break
        case 'print':
            //         {"type":"print","value":"#btc-reg-13","target":"#btc-reg-12"},
            // {"type":"return","value":"#btc-reg-12"}] 
          // expnode(node.value, target, env)
          var reg1 = uniquegen()
          expnode(node.value, reg1, btc)
          btc.push({"type":"print","value":reg1, "target": target})
          break

        default:
          lo('default btcnode error', node)
          throw new ExecError('wtfff ')
      }
    }

    function btcblock(statements) {
      // TODO step 2: Complete this function so that functions have
      // explicit return statements
      var btc = [];
      var target;
      lo('state ment', statements)
      statements.forEach(function(statement, index) {
        target = uniquegen();
        btcnode(statement, target, btc, index === statements.length - 1);
        lo('one btc', btc)
      });
      if (!target) {
        // If the body of the lambda is empty, return val is null
        target = uniquegen();
        btc.push({'type': 'null', 'target': target});
      } else {
        btc.push({'type': 'return', 'value': target});
      }
      return btc;
    }

    return btcblock(ast);
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
    // convert a JS object to a suitable 164 object
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
  
  // Returns a closure, a data structure which stores the param names
  // (id objects), the body of the function, and the referencing
  // environment, in which it was initialized --- (for lexical scoping).
  // function makeClosure(names, body, env) {
  //   // TODO step 1: use your own makeClosure here
  // }

  // Returns a stack frame, a data structure which stores 
  // information about the state of a function
  function makeStackFrame(bytecode, env, retReg) {
    // TODO step 3: decide what you need to store in a stack frame
    // based on what your bytecode interpreter needs.
    // Decide whether the arguments above are sufficient.
    lo('make stack frame ', bytecode)
    return {
      'bytecode':bytecode,
      'pc':0,
      'ret': retReg,
      'env': env,
    }
  }

  // Returns a new program state object, a data structure which stores
  // information about a particular stack
  function makeProgramState(bytecode, env, argName) {
    // TODO step 3: decide what you need to store in a program state
    // object based on what your bytecode interpreter needs.
    // Decide whether the arguments above are sufficient.
    var retReg = null
    return makeStackFrame(bytecode, env, retReg)
  }

  function resumeProgram(programState, log) {
    // TODO step 3: implement this function, which executes
    // bytecode.  See how it's called in the execBytecode function.
    lo('ps ', programState)
    var btc = programState['bytecode']
    var pc = programState['pc']
    var env = programState['env']
    lo('resume btc', btc)
    while (pc < btc.length) {
      var ins = btc[pc]
      switch(ins.type) {
        case '+':
          var lhs = envLookup(env, ins.operand1)
          var rhs = envLookup(env, ins.operand2)
          envBind(env, ins.target, lhs+rhs)
          lo('+ result', lhs , rhs)
          break
        case '-':
          var lhs = envLookup(env, ins.operand1)
          var rhs = envLookup(env, ins.operand2)
          envBind(env, ins.target, lhs-rhs)
          break
        case '*':
          var lhs = envLookup(env, ins.operand1)
          var rhs = envLookup(env, ins.operand2)
          envBind(env, ins.target, lhs*rhs)
          break
        case '/':
          var lhs = envLookup(env, ins.operand1)
          var rhs = envLookup(env, ins.operand2)
          envBind(env, ins.target, lhs/rhs)
          break
        case 'id':
          envBind(env, ins.target, envLookup(env, ins.name))
          break
        case 'def':
          envBind(env, ins.name, envLookup(env, ins.value))
          envBind(env, ins.target, envLookup(env, ins.name))
          break
        case 'ite':
          var cond = envLookup(env, ins.condition)
          if (cond == null) {
            cond = false;
          }
          if ((typeof cond != 'boolean') && (typeof cond != 'number')) {
            throw new ExecError('Condition not a boolean');
          }
          if (cond) {
            return envLookup(env, ins.true)
          } else {
            return envLookup(env, ins.false)
          }
          break
        case 'int-lit':
          envBind(env, ins.target, ins.value)
          break
        case 'print':
          envBind(env,  ins.target, envLookup(env, ins.value))
          lo('p f')
          log(envLookup(env, ins.value))
          break
        case 'lambda':
        // {"type":"lambda","arguments":[{"type":"id","name":"y"}],"target":"#btc-reg-2","body":[
          var closure = makeClosure(ins.arguments, ins.body, env)
          envBind(env, ins.target, closure)
          break;
        case 'call':

        // {"type":"call","function":"#btc-reg-14","arguments":["#btc-reg-15"],"target":"#btc-reg-13"},
          var fn = envLookup(env, ins.function)
          if (fn.type && fn.type === 'closure') {
            var newEnv = envExtend(fn.env)
            if (ins.arguments.length == fn.names.length) {
              for (var i = 0; i < fn.names.length; i++) {
                lo('new env  ',newEnv, 'name',fn.names[i].name, envLookup(env, ins.arguments[i]))
                envBind(newEnv, fn.names[i].name, envLookup(env, ins.arguments[i]))
              }
            } else {
              throw new ExecError('args length not equal');
            }
            lo('new env ' ,newEnv)
            var res = execBytecode(fn.body, newEnv, log)
            log('exec result ', res)
            envBind(env, ins.target, res)
          } else {
            throw new ExecError('Trying to call non-lambda');
          }
          break
        case 'return':
          return envLookup(env, ins.value)
          // envBind()
          break
        default:
          lo('default ins error', ins)
          throw new ExecError('wtfff ')
      }
      pc+=1
      lo('pc num', pc)
    }

  }

  function execBytecode(bytecode, env, log) {
    // TODO step 3: based on how you decide to implement
    // makeProgramState, make sure the makeProgramState call below
    // suits your purposes.
    return resumeProgram(makeProgramState(bytecode, env), log);
  }

  function tailCallOptimization(insts){
    // TODO step 5: implement this function, (which is called below).
    // It should take bytecode as input and transform call instructions
    // into tcall instructions if they can be optimized with the
    // tail call optimization.
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
  
  var root = envRoot();
  root['*title'] = 'Root';
  envBind(root,"type", function(a){
    if (a && a.type==="table"){
      return "table";
    } else {
      return "other";
    }
  });

  desugarAll(asts, [], function(desugaredAsts) {
    lo('asts ', asts)
    lo('desuger ast', desugaredAsts)
    for (var i = 0, ii = desugaredAsts.length; i < ii; ++i) {
      try {
        var bytecode = compileToBytecode(desugaredAsts[i]);
        tailCallOptimization(bytecode);
        lo('bytecode after tail', j(bytecode))
        execBytecode(bytecode, root, log);
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