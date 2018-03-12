var querystring = require('querystring');
var http = require('http');
var fs = require('fs');

if (process.argv.length != 3) {
  return console.log('Please give one argument, the input filename.');
}

// should be the filename
var file = process.argv[2];

var server = 'kaopad.cs.berkeley.edu';
var port = '8164'

fs.readFile(file, 'utf8', function (err, input_data) {
  if (err)
    console.log(err);
  
  var post_data = querystring.stringify({files: [input_data]});

  // An object of options to indicate where to post to
  var post_options = {
    host: server,
    port: port,
    path: '',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };
  
  var post_req = http.request(post_options, function(response) {
    var data = "";
  
    response.setEncoding('utf8');
    response.on('data', function(chunk) {
      data += chunk.toString();
    });
    response.on('end', function() {
      var json = JSON.parse(data);
      process.stdout.write(json.output);
      if (json.error) {
        console.error(json.error);
      }
    });
  });
  
  post_req.write(post_data);
  post_req.end();
});

