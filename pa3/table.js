if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
}

// TODO: Use Table to implement dictionaries, lists, and objects
// Complete all the requisite methods below
var lo = console.log.bind(console)
function Table() {
  this.table = {}
  this.int_dict = {}
  // return table
}

Table.prototype.put = function(key, value) {
  lo('put', key, value, this.table)
  if (typeof key == "number") {
    this.int_dict[key] = value
  } else {
    this.table[key] = value
  }
  // table = Table()
  // table[key] = value
  // lo('after put', this.table)
};

Table.prototype.has_key = function(key) {
  if (typeof key == "number") {
    if (key in this.int_dict) {
      return true
    } else {
      return false
    }
  }  else {
    if (key in this.table) {
      return true
    } else {
      return false
    } 
  }
};

Table.prototype.get = function(key) {
  lo('key, ', key)
  if (typeof key == "number") {
    if (key in this.int_dict) {
      return this.int_dict[key]
    } else {
      throw new ExecError("tried to get nonexistent key: "+ key)
    }
  } else {
    if (key in this.table) {
      return this.table[key]
    } else {
      throw new ExecError("tried to get nonexistent key: "+ key)
    }
  }
};

Table.prototype.toString = function() {

};

Table.prototype.get_length = function() {
  var i = 0
  while (i in this.int_dict){
    i+=1
  }
  return i
};

if (typeof(module) !== 'undefined') {
  module.exports = {
    Table: Table
  };
}
