'use strict';

function ExecError(m) {
  this.message = m;
}
ExecError.prototype = new Error();

function ParseError(m) {
  this.message = m;
}
ParseError.prototype = new Error();

function DesugarError(m) {
  this.message = m;
}
DesugarError.prototype = new Error();

if (typeof(module) !== 'undefined') {
  module.exports = {
    ExecError: ExecError,
    ParseError: ParseError,
    DesugarError: DesugarError
  };
}
