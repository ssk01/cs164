if (typeof(module) !== 'undefined') {
  var LocalStorage = require('./storage.js');
  localStorage = new LocalStorage('./parser.cache', {strict: false});
  var http = require('http');
}

var rparse = function(input, callback) {
  // check if input is in cache
  var cached = localStorage.getItem(input);
  if (cached) {
    setTimeout(function() {
      //here in
      console.log('cache ', cached)
      handleResponse(cached);
    }, 0);
    return;
  }

  var server = 'cs164parsertest.appspot.com';
  var port = '80';

  var path = '/parser'
  var params = { 
    'server_grammar': 'cs164c.grm', 
    'input': input
  }

  // convert program data into parameters
  function encodeParams(data) {
    var ret = [];
    for (var d in data)
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    return ret.join("&");
  }
  var encodedParams = encodeParams(params);

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
      var data = "";
    
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
      str +=path;

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
  function handleResponse(text) {
    // update cache
    localStorage.setItem(input, text);

    // Parse JSON data
    try {
      console.log('text', text) 
      var j = JSON.parse(text);
    } catch (e) {
      console.error(text);
      throw new Error('Error parsing JSON response from remote parser.');
    }

    // data should be mapped from input->{output: ..., value: ...}
    var result = j[input];

    // value contains the parse tree
    var tree = result.value;
    if (tree == 'Error')
      throw new Error('Parsing error.');

    if (tree) {
      callback(tree);
    } else if (result.output) {
      // output contains stderr when parsing
      console.error(result.output);
    }
  }
};

if (typeof(module) !== 'undefined') {
  module.exports = {};
  module.exports.rparse = rparse;
}
