if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
}

// TODO: Use Table to implement dictionaries, lists, and objects
// Complete all the requisite methods below
// var lo = console.log.bind(console)
var lo = function(){}
function Table() {
  this.table = {}
  this.int_dict = {}
  this.type = 'table'
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
    }
  } else if (key in this.table) {
    return this.table[key]
  } else {
    if ('__mt' in this.table) {
      var mt = this.table.__mt 
      lo("mt ",mt, typeof mt)
      if ('__index' in mt.table) {
        return mt.get(key)
      }
      lo('fuck no index')
    } 
    throw new ExecError("tried to get nonexistent key: "+this.toString()+"  "+ key)
  }
};

Table.prototype.toString = function() {
  //  lo("tostring ",JSON.stringify(this.table))
  var keys = Object.keys(this.table)
  var res = 'table:{ '
  console.log(typeof this.table, keys,keys.length)
  for (var i = 0; i< keys.length; i++) {
    var key = keys[i]
    var value = this.table[key]
    res = res + key + ': '
    if (value instanceof Table ){
      if (value==this ){
        res += 'self'
      } else{
        res += value.toString()
      }
        // res += value.toString()
    } else if (value.type == 'closure') {
       res += 'closure'
    } else {
      res += value
    }
    res +=', '
  }
  var idxs = Object.keys(this.int_dict)
  for (var i = 0; i < idxs.length; i++ ) {
    var key = idxs[i]
    var value = this.int_dict[key]
    res = res + key + ': '
    if (value instanceof Table ){
      if (value==this ){
        res += 'self'
      } else{
        res += value.toString()
      }
    } else if (value.type == 'closure') {
       res += 'closure'
    } else {
      res += value
    }
    res +=', '
  }
  res +='} \n'
  return res
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
