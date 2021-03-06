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
      // This helper function generates a unique register name
  function uniquegen() {
    return '#btc-reg-' + uniquegen.counter++;
  }
  uniquegen.counter = 1;
  function compileToBytecode(ast) {
    // TODO step 2: Complete this function, which takes an AST as input
    // and produces bytecode as its output
	  function pushOp( node, btc,target) {
      var reg1 = uniquegen()
      expnode(node.operand1, reg1, btc)
      var reg2 = uniquegen()
      expnode(node.operand2, reg2, btc)
      btc.push({"type":node.type,"operand1":reg1,"operand2":reg2,"target":target})
    }


    function expnode(node, target, btc) {
      switch (node.type) {
        case 'yield':
          var reg1 = uniquegen()
          expnode(node.arg, reg1, btc)
          btc.push({'type':'yield','arg':reg1, "target":target})
          break
        case 'coroutine':
          var reg1 = uniquegen()
          expnode(node.body, reg1, btc)
          btc.push({'type':'coroutine','body':reg1, "target":target})
          break
        case 'resume':
          // log('resume')
          var reg1 = uniquegen()
          expnode(node.arg, reg1, btc)
          var reg2 = uniquegen()
          expnode(node.coroutine, reg2, btc)
          btc.push({"type":"resume","arg":reg1, "coroutine":reg2, "target": target})
          // {"arg":{"type":"null"},"type":"resume","coroutine":{"type":"id","name":"co"}}}]
          break
        case 'int-lit':
          btc.push({"type":"int-lit","value":node.value,"target": target})
          break
        case 'string-lit':
          btc.push({"type":"string-lit","value":node.value,"target": target})
          break
        case 'empty-dict-lit':
          btc.push({"type":"empty-dict-lit","target": target})
          break
        case 'len':
          var reg1 = uniquegen()
          expnode(node.dict, reg1, btc)
          btc.push({"type":"len","value":reg1,"target": target})
          break
        case 'get':
          var reg1 = uniquegen()
          expnode(node.dict, reg1, btc)
          var reg2 = uniquegen()
          expnode(node.field, reg2, btc)
          btc.push({"type":"get","dict":reg1,"field":reg2,"target": target})
          break
        case 'exp':
          expnode(node.body, target, btc)
          //not sure
          break
        case 'id':
          btc.push({"type":"id","name":node.name ,"target":target})
          break
        case "null":
          btc.push({"type":"null","target":target})
          break
        case 'ite':
          var cond = uniquegen()
          var ct = uniquegen()
          var cf = uniquegen()
          expnode(node.condition, cond, btc)
          expnode(node.true, ct, btc)
          expnode(node.false, cf, btc)
          lo('')
          btc.push({"type":'ite', "condition":cond, "true":ct, "false":cf, "target":target})
          break
        case 'lambda':
          // [{"type":"lambda","arguments":[{"type":"id","name":"y"}],"target":"#btc-reg-2","body":[
          btc.push({"type":"lambda","arguments":node.arguments, "target":target, "body":btcblock(node.body)})
          break
        case 'call':
        // call node  {"function":{"type":"id","name":"fun"},"type":"call","arguments":[{"type":"int-lit","value":0}]}
        //{"type":"id","name":"fun","target":"#btc-reg-14"},
        //{"type":"int-lit","value":0,"target":"#btc-reg-15"},
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
          var op =['+', '-', '*', '/','==','!=','>','<','>=', '<=','in']
          if (op.indexOf(node.type) != -1 ){
            pushOp(node, btc, target)
            break
          }
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
        case 'put':
          var reg1 = uniquegen()
          expnode(node.dict, reg1, btc)
          var reg2 = uniquegen()
          expnode(node.field, reg2, btc)
          var reg3 = uniquegen()
          expnode(node.value, reg3, btc)
          btc.push({"type":"put","dict":reg1,"value": reg3,"field": reg2, "target":target})
          break
        case 'print':
            //         {"type":"print","value":"#btc-reg-13","target":"#btc-reg-12"},
            // {"type":"return","value":"#btc-reg-12"}] 
          // expnode(node.value, target, env)
          var reg1 = uniquegen()
          expnode(node.value, reg1, btc)
          btc.push({"type":"print","value":reg1, "target": target})
          break
        case 'asgn':
          var reg1 = uniquegen()
          expnode(node.value, reg1, btc)
          btc.push({"type":"asgn",'name':node.name.name,"value":reg1, "target": target})
          break;
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
        btc.push({'type': 'return', 'value': target});
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
  function makeStackFrame(bytecode, env, retReg,argName) {
    // TODO step 3: decide what you need to store in a stack frame
    // based on what your bytecode interpreter needs.
    // Decide whether the arguments above are sufficient.
    // lo('make stack frame ', bytecode)
    return {
      'bytecode':bytecode,
      'pc':0,
      'ret': retReg,
      'env': env,
      'arg':argName,
    }
  }

  // Returns a new program state object, a data structure which stores
  // information about a particular stack
  function makeProgramState(ps, bytecode, env, Name,argName) {
    // TODO step 3: decide what you need to store in a program state
    // object based on what your bytecode interpreter needs.
    // Decide whether the arguments above are sufficient.
    if (ps == null) {
      ps = {
        'name':Name,
        'from': null,
        'status': 'suspend',
        'main': false,
        'callStack': [],
      }
    }
    var retReg = uniquegen()
    // var retReg = null;
    var frame = makeStackFrame(bytecode, env, retReg,argName)
    ps.callStack.push(frame)
    return ps
  }
  function bindOpresult(ins, env) {
    var lhs = envLookup(env, ins.operand1)
    var rhs = envLookup(env, ins.operand2)
    var result = 0
    if (ins.type == '+') {
      result = lhs+rhs
    }
    else if (ins.type == '-') {
      result = lhs-rhs
    }
    else if (ins.type == '*') {
      result = lhs*rhs
    }
    else if (ins.type == '/') {
      result = lhs/rhs
    }
    else if (ins.type == '==') {
      result = (lhs==rhs)
    }
    else if (ins.type == '!=') {
      result = (lhs!=rhs)
    }
    else if (ins.type == '>') {
    result = (lhs>rhs)
    }
    else if (ins.type == '<') {
      result = (lhs<rhs)
    }
    else if (ins.type == '>=') {
    result = (lhs>=rhs)
    }
    else if (ins.type == '<=') {
      result = (lhs<=rhs)
    }
    else if (ins.type == 'in') {
      result = (rhs.has_key(lhs))
    }
    envBind(env, ins.target, result)
  }
  var allPs = []
  function resumeProgram(programState, log) {
    // TODO step 3: implement this function, which executes
    // bytecode.  See how it's called in the execBytecode function.
    allPs.push(programState)
    var cs = programState.callStack
    var frame = cs[cs.length-1]
    lo('ps ', frame)
    var btc = frame['bytecode']
    var env = frame['env']
    lo('resume btc', btc)
    while (frame['pc'] < btc.length) {
      if (frame['pc'] == 0) {
        lo('first frame  ',  cs.length, btc, j(btc))
        
      }
      var ins = btc[frame['pc']]
      lo('pc num', frame['pc'], j(ins))
      switch(ins.type) {
        case 'int-lit':
          envBind(env, ins.target, ins.value)
          break
        case 'string-lit':
          envBind(env, ins.target, ins.value)
          break
        case 'empty-dict-lit':
          var table = new Table()
          envBind(env, ins.target, table)
          break
        case 'put':
          var table = envLookup(env, ins.dict)
          var value = envLookup(env, ins.value)
          var field = envLookup(env, ins.field)
          table.put(field, value)
          envBind(env, ins.target, null)
          // btc.push({"type":"put","dict":reg1,"value": reg2,"field": reg3, "target":target})
          break
        case 'len':
          var table = envLookup(env, ins.value)
          if (table.type == 'table') {
            var lens = table.get_length()
            envBind(env, ins.target, lens)
          } else {
            lo('len false ')
          }
          break
        case 'get':
          var table = envLookup(env, ins.dict)
          var field = envLookup(env, ins.field)
          if (table.type == 'table') {
            var value = table.get(field)
            envBind(env, ins.target, value)
          } else {
            lo('len false ')
          }
          break

        case 'asgn':
        // btc.push({"type":"asgn",'name':node.name.name,"value":reg1, "target": target})
          var lhs = envLookup(env, ins.value)
          envUpdate(env, ins.name, lhs)
          envBind(env, ins.target, null)
          break
        case 'id':
          envBind(env, ins.target, envLookup(env, ins.name))
          break
        case "null":
          envBind(env, ins.target, null)
          break
        case 'def':
          lo(ins.name, 'name ',ins.value)
          envBind(env, ins.name, envLookup(env, ins.value))
          envBind(env, ins.target, envLookup(env, ins.name))
          lo('env',env)
          
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
            envBind(env, ins.target, envLookup(env, ins.true))
          } else {
            envBind(env, ins.target, envLookup(env, ins.false))
            // return envLookup(env, ins.false)
          }
          break

        case 'print':
          
          var exp = envLookup(env, ins.value)
          envBind(env,  ins.target, null)
          // lo('p f', exp, ins.value)
          if (typeof exp == 'object' && exp != null) {
            if (exp.type == 'closure') {
              log('closure')
              break
            }
          }
          if(exp instanceof Table){
            log(exp.toString())
            break
          }
          log(exp)
          break
        case 'lambda':
        // {"type":"lambda","arguments":[{"type":"id","name":"y"}],"target":"#btc-reg-2","body":[
          var closure = makeClosure(ins.arguments, ins.body, env)
          envBind(env, ins.target, closure)
          break;
        case 'yield':
          if (programState.main == true) {
            throw new ExecError('main coroutine can not yield')
          }
          var ret = envLookup(env, ins.arg)
          programState.status = 'suspend'
          // frame.pc += 1
          lo('yield next pc ',btc[frame.pc])
          var p = programState.from
          programState = p
          cs = programState.callStack
          if (cs.length == 0) {
            lo('ps', programState)
            throw new ExecError('it is impossible')
          }
          frame = cs[cs.length-1]
          btc = frame['bytecode']
          env = frame['env']
          ins = btc[frame['pc']]
          envBind(env, ins.target, ret)
          break
        case 'coroutine':
          lo('env',env)
          var name = ins.body
          var fun = envLookup(env, name)
          // fun.name = name
          if (fun.type == 'closure') {
            // throw new ExecError('Condition not a boolean');
            var newps = makeProgramState(null, fun.body, fun.env, null, fun.names);
            allPs.push(newps)
            newps.from = programState
            lo('all ps ', allPs)
            envBind(env, ins.target, newps)
          } else {
            lo('coroutine fun error ')
          }
          break
        case 'resume':
          var p = envLookup(env, ins.coroutine)
          lo('resume ',ins)
          // lo('resume coroutine ', co)
          //todo
          var arg = envLookup(env, ins.arg)
          // var n = co.name
          // for (var i = 0; i <allPs.length; i++) {
          //   var p = allPs[i]
          //   if (p.name == n ) {
          //     p.from = programState.name
          if (p.status == 'suspend') {
            programState = p
            cs = programState.callStack
            frame = cs[cs.length-1]
            btc = frame['bytecode']
            env = frame['env']
            ins = btc[frame.pc]
            if (frame.pc == 0) {
              var newEnv = envExtend(env)

              envBind(newEnv,frame.arg[0].name  ,arg)
              lo('fuck', frame.arg,arg)
              frame.env = newEnv
              env = newEnv
              continue
            } else {
              envBind(env, ins.target, arg)

            }
          } else {
            throw new ExecError('Coroutine not resumable.')
          }
          lo('find ps times')
              // break
          // btc.push({"type":"resume","arg":reg1, "coroutine":reg2, "target": target})
          break
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
            // lo('new env ' ,newEnv)
            // var res = execBytecode(fn.body, newEnv, log)
            // lo('fn.body  ', fn.body)
            lo('allps ', allPs, programState)
            programState = makeProgramState(programState, fn.body, newEnv)
            lo('allps ', allPs, programState)
             cs = programState.callStack
             frame = cs[cs.length-1]
            // lo('ps ', frame)
             btc = frame['bytecode']
            //  pc = frame['pc']
             env = frame['env']
             continue
            // log('exec result ', res)
            // envBind(env, ins.target, res)
          } else {
            // lo('pc :', frame['pc'], bec)
            throw new ExecError('Trying to call non-lambda, not function');
          }
          break
        case 'return':
          // log('call stk', cs)
          // lo('return ss', frame.pc)
          var ret = envLookup(env, ins.value)
          cs.pop()
          if (cs.length) {
            frame = cs[cs.length-1] 
            btc = frame['bytecode']
            env = frame['env']
            ins = btc[frame['pc']]
            envBind(env, ins.target, ret)
          } else {
            if (programState.main == false) {
              programState.status = 'end';
              var p = programState.from
              programState = p
              cs = programState.callStack
              frame = cs[cs.length-1]
              btc = frame['bytecode']
              env = frame['env']
              ins = btc[frame['pc']]
              envBind(env, ins.target, ret)
              // continue
            } else {
              return ret
            }
          }
          // envBind()
          break
        case 'tailCall':
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
            var newframe =makeStackFrame(fn.body, newEnv, ins.target)
            cs.pop()
            cs.push(newframe)
            frame = newframe
            btc = frame['bytecode']
            env = frame['env']
            ins = btc[frame['pc']]
            continue
          }
        default:
          var op =['+', '-', '*', '/','==','!=','>','<','>=', '<=', 'in']
          if (op.indexOf(ins.type) != -1 ){
            bindOpresult(ins,env)
            break;
          }
          lo('default ins error', ins)
          throw new ExecError('wtfff ')
      }
      frame['pc']+=1
    }

  }

  function execBytecode(bytecode, env, log) {
    // TODO step 3: based on how you decide to implement
    // makeProgramState, make sure the makeProgramState call below
    // suits your purposes.
    var ps ={
      'name': 'main',
      'status': 'running',
      'main': true,
      'callStack': [],
    }
    var res = resumeProgram(makeProgramState(ps, bytecode, env), log);
    lo('in the end ', allPs)
    return res
  }

  function tailCallOptimization(insts){
    // TODO step 5: implement this function, (which is called below).
    // It should take bytecode as input and transform call instructions
    // into tcall instructions if they can be optimized with the
    // tail call optimization.
    for (var i = 0; i < insts.length; i++) {
      if (insts[i]['type'] == 'lambda') {
        tailCallOptimization(insts[i].body)
      }
    }
    lo('tcall type, ',insts,insts)
    if (insts.length > 1 && insts[insts.length-2]['type']  == 'call') {
      // var ins = insts[insts.length-2]
      // inst
      insts[insts.length-2]['type'] = 'tailCall'
      lo('are you ok', insts[insts.length-2])
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
    lo('desuger ast', desugaredAsts[2], j(desugaredAsts[2]))
    for (var i = 0, ii = desugaredAsts.length; i < ii; ++i) {
      try {
        var bytecode = compileToBytecode(desugaredAsts[i]);
        tailCallOptimization(bytecode);
        lo('bytecode after tail', j(bytecode),bytecode)
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
