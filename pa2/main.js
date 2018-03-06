var interpret = require('./interpreter.js').interpret;
var rparse = require('./rparse.js').rparse;
var fs = require('fs');

if (process.argv.length != 3) {
  return console.log('Please give one argument, the input filename.');
}

var useLibrary = false;

var libraryFile = "./library.164";
var inputFile = process.argv[2];

fs.readFile(inputFile, 'utf8', function (err, input_data) {
  if (err) { return console.log(err); }
  rparse(input_data, function(input_ast) {
    console.log('input_ast', input_ast)
    
    if (useLibrary) {
      fs.readFile(libraryFile, 'utf8', function (err, library_data) {
        if (err) { return console.log(err); }
        rparse(library_data, function(library_ast) {
          interpret([library_ast, input_ast], function(x) {
            console.log(x);
          });
        });
      });
    } else {
      interpret([input_ast], function(x) {
        console.log(x);
      });
    }
  });
});
