var interpret = require('./interpreter.js').interpret;
var rparse = require('./rparse.js').rparse;
var fs = require('fs');

if (process.argv.length != 3) {
  return console.log('Please give one argument, the input filename.');
}

var inputFile = process.argv[2];
var files = ['./library.164', './object.164',inputFile];

var fileContents = [];
var readFiles = function(files) {
  var file, remainingFiles;
  if (files.length > 0) {
    file = files.shift();
    remainingFiles = files;
  }
  else { //no more files to read, ready to parse and interpret
    rparse(fileContents, function(asts) {
      interpret(asts, function(x) {
        console.log(x);
      });
    });
    return;
  }
  fs.readFile(file, 'utf8', function(err, fileContent) {
    if (err) { return console.log(err); }
    fileContents.push(fileContent);
    readFiles(remainingFiles);
  });
}
readFiles(files);
