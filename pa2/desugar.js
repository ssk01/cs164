// check if we are in node
if (typeof(module) !== 'undefined') {
  var rparse = require('./rparse.js').rparse;
}

// produce a lexical scope using function scoping
// http://en.wikipedia.org/wiki/Immediately-invoked_function_expression
var desugarAST = (function() {

  // raw expansions for desugaring written in the desugaring DSL
  var DESUGAR_AST_RAW = {
    // TODO: Write desugaring expansions for "while", "if" and "for",
    // replacing the example below
    "example": "def %u1 = %nodeattribute",
    "if": " ite(%condition,lambda(){%true}, lambda(){%false}  )()",
    "while":"lambda(){def %u1 = lambda(cond, b){ite(cond(), lambda(){b(); %u1(cond,b)},lambda(){})();}; %u1(lambda(){%condition},lambda(){ %body})}()",
    // "while":
    "for": "lambda(){def %u2 = %iterable; def %name = %u2(); while(%name !=null){lambda(%name){%body}(%name);%name=%u2()}}()"
    //  "(lambda(%u1, %u2){def %u3 = %u1() if (%u3){ %u2()}if (%u3){ %u3(%u1, %u2) } } )(lambda(){%condition}, lambda(){%body})" 
    //  "lambda(){function %u3(%e1, %e2){def %e33 = %e1() if (%e33){ %e2()}if (%e33){ %u3(%e1, %e2) } } %u3(lambda(){%condition}, lambda(){%body})}()" 
  };
  // “if” : “(lambda(){ \
  //            def %u1 = 
  // %condition
  // ; \
  //            ite(%u1, lambda(){
  // %true
  // }, lambda(){
  // %false
  // })() \
  //         })()”
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
    rparse(DESUGAR_AST_RAW[t], function(parsed) {
      var expansionTree = parsed[0];
      console.log('ast_raw ',DESUGAR_AST_RAW[t],'  ', expansionTree)
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
      console.log('out ', out, 'node ', node)
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
    console.log('expansion tree ', expansionTree, 'parse tree', parseTree)
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
          // wraps a list of statements into one expression
          function makeExpression(k) {
            if (k.constructor === Array) {
              return {
                'type': 'call',
                'function': {
                  'type': 'lambda',
                  'arguments': [],
                  'body': k
                },
                'arguments': []
              }
            }
            return k;
          }

          var child = parseTree[name]
          if (!child) {
            throw new Error('Unknown metavariable %' + name);
          }
          return makeExpression(desugar(child));
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
      console.log("DESUGAR_AST_COMPILED",DESUGAR_AST_COMPILED)
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
