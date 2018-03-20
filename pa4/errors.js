function ExecError(m) {
  this.message = m;
}
ExecError.prototype = Error;
ExecError.prototype.constructor = ExecError;

if (typeof(module) !== 'undefined') {
  module.exports = {
    ExecError: ExecError
  };
}
