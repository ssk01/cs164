'use strict';

// check if we are in node
if (typeof(module) !== 'undefined') {
  var rparse = require('./rparse.js').rparse;
  var DesugarError = require('./errors.js').DesugarError;
}
// var lo = console.log.bind(console)
var lo = function(){}

// produce a lexical scope using function scoping
// http://en.wikipedia.org/wiki/Immediately-invoked_function_expression
var desugarAST = (function() {

  // raw expansions for desugaring written in the desugaring DSL
  var DESUGAR_AST_RAW = {
    "example": "def %u1 = %nodeattribute",
    "if": " ite(%condition,lambda(){%true}, lambda(){%false}  )()",
    "while":"lambda(){def %u1 = lambda(cond, b){ite(cond(), lambda(){b(); %u1(cond,b)},lambda(){})();}; %u1(lambda(){%condition},lambda(){ %body})}()",
    // "while":"lambda(){}()",
    // "for": "lambda(){def %u2 = null; def %u3 = %iterable;"+
    //         "%u2=%u3;"+
    //             "def %name = %u2();"+
    //       "while(%name!=null) {lambda(%name){%body}(%name); %name = %u2();}}()",
    "for": "lambda(){def %u2 = null; def %u3 = %iterable;"+
            "if(type(%u3)=='table'){%u2=_getIterator_(%u3);}else{%u2=%u3};"+
                "def %name = %u2();"+
          "while(%name!=null) {lambda(%name){%body}(%name); %name = %u2();}}()",


    //   "comprehension": "lambda(){"+
    //       "def %u1={}; def %u2=0; for(%name in %iterable){%u1[%u2]=lambda(%name){%expression}(%name); %u2=%u2+1;}; %u1;"+
    //  "}()"
    "||":"lambda(){ if (%operand1){1} else {"+
          " if (%operand2) {1} else {0}"+
          "}  }()",
    "&&": "lambda(){ if(%operand1){ if(%operand2){1}else {0}} else {0} }()",
  "comprehension":" lambda(){def %u5 = _getIterator_(%iterable);"+
                  "def %name = %u5();"+
                  "def %u6 ={}; def %u7 = 0;"+
                  "while(%name!=null) {%u6[%u7] = lambda(%name){%expression}(%name); %u7=%u7+1;%name = %u5();}\n"+
                  "%u6;}()",
    // "comprehension":"lambda(){}()",


  // "for": "lambda(){def %u2 = %iterable;" + 
    // "def %u3 = null;"+
    // "if (type(%u2) == 'table') {%u3 = _getIterator_(%u2);} else {%u3=%u2};"+
    // " def %name = %u3(); print 'name'; print %name;while(%name !=null){lambda(%name){%body}(%name);%name=%u3()}}()"
    //  "(lambda(%u1, %u2){def %u3 = %u1() if (%u3){ %u2()}if (%u3){ %u3(%u1, %u2) } } )(lambda(){%condition}, lambda(){%body})" 
   
  };

  // compiled version of the raw expressions (created after the raw
  // expressions have parsed)
  var DESUGAR_AST_COMPILED = {};

  // parsing occurs asynchronously on the server, so responses to requests
  // need to be delayed until DESUGAR_AST_COMPILED is ready
  var ready = false;
  var desugarQueue = [];

  // process items on desugarQueue
  function desugarReady() {
    desugarQueue.forEach(function(d) {
      d.callback(desugar(d.input));
    });
  }

  // iterate through each desugaring expansion
  Object.keys(DESUGAR_AST_RAW).forEach(function(t) {
    rparse([DESUGAR_AST_RAW[t]], function(parsed) {
      var expansionTree = parsed[0][0];
      // fillHoles does the heavy lifting, taking the original parse tree and
      // desugaring expressions according to expansion
      DESUGAR_AST_COMPILED[t] = function(parseTree) {
        return fillHoles(expansionTree, parseTree);
      };

      // check is all expansions have been compiled
      if (Object.keys(DESUGAR_AST_COMPILED).length
          >= Object.keys(DESUGAR_AST_RAW).length) {
        ready = true;
        desugarReady();
      }
    });
  });

  // map a function onto a node, which can be any type
  function mapNode(node, f) {
    // check null first since typeof null is "object".
    if (node === null) {
      return f(node);
    } else if (node.constructor === Array) {
      return node.map(f);
    } else if (typeof(node) === 'object') {
      var out = {};
      for (var key in node) {
        out[key] = f(node[key]);
      }
      return out;
    } else {
      return f(node);
    }
  }

  // create a unique id or if n exists in cache, return the previously
  // generated unique id
  function uniqueGen(n, cache) {
    return cache[n] || (cache[n] = '#sug-reg-' + uniqueGen.counter++);
  }
  uniqueGen.counter = 1;

  // takes an expansion tree (which has holes such as %u12 and %conditional in
  // it) and apply it to a part of the parse tree. the result is a copy of the
  // expansion tree with all holes filled in.
  function fillHoles(expansionTree, parseTree) {
    // cache so that all holes filled during this call are consistent (ie two
    // occurences of %u12 are replaced with the same unique variable name)
    var cache = [];

    function fill(node) {
      // we found a macro node, which means that it need
      if (typeof(node) === 'object' && node.type === 'macro') {
        var name = node.name;

        // find an instance of a metavarible in the expansion that needs to be
        // replaced with a unique variable name (ie %u12)
        var e = /u(\d+)/.exec(name);
        if (e) {
          return {'type': 'id', 'name': uniqueGen(e[1], cache)};
        // otherwise, the metavariable must refer to a part of parseTree
        // (ie %conditional)
        } else {
          var child = parseTree[name];
          if (!child) {
            throw new DesugarError('Unknown metavariable %' + name);
          }

          var desugaredChild = desugar(child);
          // wrap desugared statements into a single expression
          if (desugaredChild.constructor === Array) {
            return {
              'type': 'call',
              'function': {
                'type': 'lambda',
                'arguments': [],
                'body': desugaredChild
              },
              'arguments': []
            };
          } else {
            return desugaredChild;
          }
        }
      // recursively fill the holes in children nodes
      } else if (typeof(node) === 'object') {
        return mapNode(node, fill);
      // found a leaf
      } else {
        return node;
      }
    }
    return fill(expansionTree);
  }

  // main desugaring method
  function desugar(node) {
    // desugaring on by case analysis on the type of node
    // list of statements
    if (node && node.constructor === Array) {
      return node.map(desugar);
    // leaf node
    } else if (typeof(node) !== 'object') {
      return node;
    } else if (DESUGAR_AST_COMPILED[node.type]) {
      // the nodes operation has a ruled defined in out deguaring DSL.
      // recursive call is necessary because some expansions use desugared
      // syntax
      return desugar(DESUGAR_AST_COMPILED[node.type](node));
    // we need to handle class method calls seperately since our desugaring
    // DSL is not expressive enough to represent this transformation.
    // specifically method calls and dictionary literals
    } else if (node.type === 'mcall') {
      var tmp = '#tmp';
      var obj = desugar(node.obj);
      var dArgs = [];
      for (var i in node.args) {
        dArgs.push(desugar(node.args[i]));
      }
      var res = desugar({
        'type': 'call',
        'function': {
          'type': 'lambda',
          'arguments': [],
          'body': [
            {'type': 'def', 'name': {'type': 'id', 'name': tmp}, 'value': obj},
            {'type':'exp', 'body':{'type': 'call',
              'function': {
                'type': 'get',
                'dict': {'type': 'id', 'name': tmp},
                'field': {'type': 'string-lit', 'value': node.mname.name}
              },
              'arguments': [{'type': 'id', 'name': tmp}].concat(dArgs)
            }}
          ]
        },
        'arguments': []
      });
      lo('1234mcall obj, ', node.obj, node.mname, dArgs, node)
      
      return res;
    } else if (node.type === 'dict-lit') {
      var asgns = [];
      var dictname = {'type': 'id', 'name': '#dictassignment'};
      lo('node value ', node.value)
      node.value.forEach(function(val) {
        
        asgns.push(desugar({
          'type': 'put',
          'dict': dictname,
          'field': {'type': 'string-lit', 'value': val.name},
          'value': val.value
        }));
      });

      asgns.push({"type":"exp","body":dictname});
     
      return desugar({
        'type': 'call',
        'function': {
          'type': 'lambda',
          'arguments': [dictname],
          'body': asgns
        },
        'arguments': [{'type': 'empty-dict-lit'}]
      });
    }
    else {
      return mapNode(node, desugar);
    }
  }

  // wrapper around desugar and all the queueing functionality needed to get
  // around asynchrony issues
  function desugarExport(tree, callback) {
    if (ready) {
      callback(desugar(tree));
    } else {
      desugarQueue.push({input: tree, callback: callback});
    }
  }

  return desugarExport;
})();

if (typeof(module) !== 'undefined') {
  module.exports = {
    desugarAST: desugarAST
  };
}
