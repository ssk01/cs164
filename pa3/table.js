if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
}

// TODO: Use Table to implement dictionaries, lists, and objects
// Complete all the requisite methods below
var lo = console.log.bind(console)
function Table() {
  this.table = {
  }
  // return table
}

Table.prototype.put = function(key, value) {
  lo('put', key, value, this.table)
  // table = Table()
  // table[key] = value
  this.table[key] = value
  lo('after put', this.table)
};

Table.prototype.has_key = function(key) {
};

Table.prototype.get = function(key) {
  lo('key, ', key)
  return this.table[key]
};

Table.prototype.toString = function() {
};

Table.prototype.get_length = function() {
};

if (typeof(module) !== 'undefined') {
  module.exports = {
    Table: Table
  };
}
