'use strict';

if (typeof(module) !== 'undefined') {
  var LocalStorage = require('./storage.js');
  var localStorage = new LocalStorage('./parser.cache', {strict: false});
  var http = require('http');
  var ParseError = require('./errors.js').ParseError;
}

var rparse = function(inputArray, callback) {
  var inputs = [];
  
  for (var i = 0; i<inputArray.length; i++){
    var input = inputArray[i];
    // check if input is in cache
    var cached = localStorage.getItem(input);
    if (!cached){
      inputs.push(input);
    }
  }
  
  if (inputs.length == 0){
      setTimeout(function() {
        handleResponse("[]");
      }, 0);
      return;
  }

  var server = 'cs164parsertest.appspot.com';
  var port = '80';

  var path = '/parser';

  // convert program data into parameters
  function encodeParams(inputs) {
    var ret = [];
    ret.push(encodeURIComponent('server_grammar') + '=' + encodeURIComponent('cs164c.grm'));
    for (var i in inputs)
      ret.push(encodeURIComponent('input') + '=' + encodeURIComponent(inputs[i]));
    return ret.join('&');
  }
  var encodedParams = encodeParams(inputs);

  // check if we are in nodejs so we can use http instead of XMLHttpRequest
  if (typeof(module) !== 'undefined') {
    // An object of options to indicate where to post to
    var postOptions = {
      host: server,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': encodedParams.length
      }
    };

    var postReq = http.request(postOptions, function(response) {
      var data = '';

      response.setEncoding('utf8');
      response.on('data', function(chunk) {
        data += chunk.toString();
      });
      response.on('end', function() {
        handleResponse(data);
      });
    });

    postReq.write(encodedParams);
    postReq.end();

  // we are not in node, so issue an XLMHttpRequest
  } else {
    var str = 'http://' + server;
    if (port)
      str += ':' + port;
    if (path)
      str += path;

    var r = new XMLHttpRequest();
    r.open('POST', str, true);
    r.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    r.onload = function(x) {
      if (r.status === 200)
        handleResponse(r.responseText);
    };
    r.send(encodedParams);
  }

  // Handle the server response
  function handleResponse(texts) {

    // Parse JSON data
    try {
      var j = JSON.parse(texts);
    } catch (e) {
      console.error(texts);
      throw new ParseError('Error parsing JSON response from remote parser.');
    }
    
    // update cache
    for (var input in j){
      localStorage.setItem(input,JSON.stringify(j[input]));
    }
    
    var trees = [];
    for (var i=0; i<inputArray.length; i++){
      var input = inputArray[i];
      var result = JSON.parse(localStorage.getItem(input));
      
      // value contains the parse tree
      var tree = result.value;
      if (tree == 'Error'){
        throw new ParseError('Parsing error.');
      }
      if (!tree && result.output){
        console.error(result.output);
        return;
      }
      trees.push(tree);
    }
    callback(trees);
  }
};

if (typeof(module) !== 'undefined') {
  module.exports = {
    'rparse': rparse
  };
}
